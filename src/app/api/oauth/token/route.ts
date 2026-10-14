import {
  checkClientSecret,
  issueTokens,
  redeemCode,
  redeemRefreshToken,
  resolveClient,
} from "@/lib/mcp/oauth";

// OAuth token endpoint for MCP connectors: exchanges an authorization code
// (with its PKCE verifier) or a refresh token for an access token

const error = (code: string, description: string, status = 400) =>
  Response.json(
    { error: code, error_description: description },
    { status, headers: { "Cache-Control": "no-store" } },
  );

async function readParams(req: Request) {
  if (req.headers.get("content-type")?.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    return new URLSearchParams(Object.entries(body).map(([k, v]) => [k, String(v)]));
  }
  return new URLSearchParams(await req.text());
}

// client_secret_basic sends credentials in the header; everything else in the body
function readClientCredentials(req: Request, params: URLSearchParams) {
  const header = req.headers.get("authorization");
  if (header?.toLowerCase().startsWith("basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString();
    const split = decoded.indexOf(":");
    if (split !== -1) {
      return {
        clientId: decodeURIComponent(decoded.slice(0, split)),
        clientSecret: decodeURIComponent(decoded.slice(split + 1)),
      };
    }
  }
  return { clientId: params.get("client_id"), clientSecret: params.get("client_secret") };
}

export async function POST(req: Request) {
  const params = await readParams(req);
  const { clientId, clientSecret } = readClientCredentials(req, params);

  const client = await resolveClient(clientId);
  if (!client || !checkClientSecret(client, clientSecret)) {
    return error("invalid_client", "Unknown client or bad client credentials", 401);
  }

  const grantType = params.get("grant_type");

  if (grantType === "authorization_code") {
    const grant = redeemCode(
      params.get("code"),
      client.clientId,
      params.get("redirect_uri"),
      params.get("code_verifier"),
    );
    if (!grant) return error("invalid_grant", "The code is invalid, expired or doesn't match this request");
    return Response.json(issueTokens(client.clientId, grant.userId), { headers: { "Cache-Control": "no-store" } });
  }

  if (grantType === "refresh_token") {
    const grant = redeemRefreshToken(params.get("refresh_token"), client.clientId);
    if (!grant) return error("invalid_grant", "The refresh token is invalid or expired");
    return Response.json(issueTokens(client.clientId, grant.userId), { headers: { "Cache-Control": "no-store" } });
  }

  return error("unsupported_grant_type", "Use authorization_code or refresh_token");
}
