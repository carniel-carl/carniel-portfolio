import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// A small, stateless OAuth 2.1 authorization server for the /api/mcp endpoint,
// so Claude connectors can sign in through the admin instead of using a static
// key. Nothing is stored: client ids, codes and tokens are HMAC-signed blobs
// keyed off MCP_API_KEY, so rotating that key revokes every connection.
//
// Only Claude's own callback URLs (and localhost, for Claude Code) can receive
// codes, and PKCE (S256) is required. The short code lifetime stands in for
// single-use codes, which would need storage.

export const MCP_SCOPE = "blog:draft";

const CODE_TTL = 5 * 60;
export const ACCESS_TTL = 60 * 60;
const REFRESH_TTL = 60 * 24 * 60 * 60;

const TRUSTED_HOSTS = ["claude.ai", "claude.com"];
const LOOPBACK_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

type Kind = "client" | "code" | "access" | "refresh";

const now = () => Math.floor(Date.now() / 1000);

function signingKey() {
  const key = process.env.MCP_API_KEY;
  if (!key || key.length < 32) return null;
  // Derived, so a leaked OAuth token never reveals the static key
  return createHash("sha256").update(`mcp-oauth:${key}`).digest();
}

const mac = (key: Buffer, body: string) => createHmac("sha256", key).update(body).digest();

function sign(kind: Kind, payload: Record<string, unknown>, ttl?: number) {
  const key = signingKey();
  if (!key) throw new Error("MCP_API_KEY is not configured");
  const body = Buffer.from(
    JSON.stringify({ ...payload, k: kind, ...(ttl && { exp: now() + ttl }) }),
  ).toString("base64url");
  return `${body}.${mac(key, body).toString("base64url")}`;
}

function verify<T>(kind: Kind, token: string | null | undefined): (T & { exp?: number }) | null {
  const key = signingKey();
  if (!key || !token) return null;

  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined) return null;

  const given = Buffer.from(signature, "base64url");
  const expected = mac(key, body);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.k !== kind || (payload.exp && payload.exp < now())) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export type OAuthClient = {
  clientId: string;
  name: string;
  redirectUris: string[];
  // "none" for public clients (PKCE only); otherwise a client_secret is checked
  authMethod: "none" | "client_secret_post" | "client_secret_basic";
};

const isTrustedHost = (host: string) =>
  TRUSTED_HOSTS.some((trusted) => host === trusted || host.endsWith(`.${trusted}`));

export function isAllowedRedirect(uri: string) {
  try {
    const url = new URL(uri);
    if (url.protocol === "https:") return isTrustedHost(url.hostname);
    return url.protocol === "http:" && LOOPBACK_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

// Dynamic client registration (RFC 7591): the client id carries its own
// registration, and the secret is derived from it, so neither needs a table
export function registerClient(input: {
  redirectUris: string[];
  name: string;
  authMethod: OAuthClient["authMethod"];
}) {
  const clientId = sign("client", { r: input.redirectUris, n: input.name, a: input.authMethod });
  return { clientId, clientSecret: input.authMethod === "none" ? undefined : clientSecret(clientId) };
}

function clientSecret(clientId: string) {
  const key = signingKey();
  if (!key) throw new Error("MCP_API_KEY is not configured");
  return mac(key, `secret:${clientId}`).toString("base64url");
}

export function checkClientSecret(client: OAuthClient, secret: string | null) {
  if (client.authMethod === "none") return true;
  if (!secret) return false;
  const expected = Buffer.from(clientSecret(client.clientId));
  const given = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// Client ID Metadata Documents: the client id is an https URL serving its
// registration. Restricted to Claude's domains so this server never fetches
// arbitrary URLs on a stranger's behalf.
async function fetchClientMetadata(clientId: string): Promise<OAuthClient | null> {
  const url = new URL(clientId);
  if (url.protocol !== "https:" || !isTrustedHost(url.hostname)) return null;

  const res = await fetch(url, { signal: AbortSignal.timeout(5_000), cache: "no-store" });
  if (!res.ok) return null;
  const doc = await res.json();
  if (doc?.client_id !== clientId || !Array.isArray(doc.redirect_uris)) return null;

  return {
    clientId,
    name: typeof doc.client_name === "string" ? doc.client_name : url.hostname,
    redirectUris: doc.redirect_uris.filter((uri: unknown) => typeof uri === "string"),
    authMethod: "none",
  };
}

export async function resolveClient(clientId: string | null | undefined): Promise<OAuthClient | null> {
  if (!clientId) return null;
  if (clientId.startsWith("https://")) {
    try {
      return await fetchClientMetadata(clientId);
    } catch {
      return null;
    }
  }

  const registered = verify<{ r: string[]; n: string; a: OAuthClient["authMethod"] }>("client", clientId);
  if (!registered) return null;
  return { clientId, name: registered.n, redirectUris: registered.r, authMethod: registered.a };
}

// ---------------------------------------------------------------------------
// Authorization requests, codes and tokens
// ---------------------------------------------------------------------------

export type AuthorizeRequest = {
  client: OAuthClient;
  redirectUri: string;
  codeChallenge: string;
  state?: string;
};

export type AuthorizeParams = Partial<Record<string, string>>;

export async function parseAuthorizeRequest(
  params: AuthorizeParams,
): Promise<{ ok: true; request: AuthorizeRequest } | { ok: false; error: string }> {
  if (params.response_type !== "code") return { ok: false, error: "Unsupported response_type; expected \"code\"." };

  const client = await resolveClient(params.client_id);
  if (!client) return { ok: false, error: "Unknown or invalid client. Remove the connector in Claude and add it again." };

  const redirectUri =
    params.redirect_uri ?? (client.redirectUris.length === 1 ? client.redirectUris[0] : undefined);
  if (!redirectUri || !client.redirectUris.includes(redirectUri) || !isAllowedRedirect(redirectUri)) {
    return { ok: false, error: "The redirect URL isn't registered for this client." };
  }

  if (!params.code_challenge || params.code_challenge_method !== "S256") {
    return { ok: false, error: "PKCE with S256 is required." };
  }

  return {
    ok: true,
    request: { client, redirectUri, codeChallenge: params.code_challenge, state: params.state },
  };
}

export const issueCode = (request: AuthorizeRequest, userId: string) =>
  sign("code", { c: request.client.clientId, r: request.redirectUri, ch: request.codeChallenge, u: userId }, CODE_TTL);

export function redeemCode(code: string | null, clientId: string, redirectUri: string | null, verifier: string | null) {
  const grant = verify<{ c: string; r: string; ch: string; u: string }>("code", code);
  if (!grant || grant.c !== clientId || !verifier) return null;
  // redirect_uri may be omitted only if it was omitted at /authorize too
  if (redirectUri && grant.r !== redirectUri) return null;

  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return challenge === grant.ch ? { userId: grant.u } : null;
}

export function issueTokens(clientId: string, userId: string) {
  return {
    access_token: sign("access", { c: clientId, u: userId }, ACCESS_TTL),
    token_type: "Bearer",
    expires_in: ACCESS_TTL,
    refresh_token: sign("refresh", { c: clientId, u: userId }, REFRESH_TTL),
    scope: MCP_SCOPE,
  };
}

export function redeemRefreshToken(token: string | null, clientId: string) {
  const grant = verify<{ c: string; u: string }>("refresh", token);
  return grant && grant.c === clientId ? { userId: grant.u } : null;
}

export function verifyAccessToken(token: string) {
  const grant = verify<{ c: string; u: string }>("access", token);
  return grant ? { clientId: grant.c, userId: grant.u, expiresAt: grant.exp } : null;
}
