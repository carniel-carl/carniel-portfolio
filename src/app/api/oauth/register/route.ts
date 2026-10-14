import { isAllowedRedirect, registerClient, type OAuthClient } from "@/lib/mcp/oauth";

// Dynamic client registration (RFC 7591) for MCP connectors

const AUTH_METHODS = ["none", "client_secret_post", "client_secret_basic"];

const fail = (error: string, description: string) =>
  Response.json({ error, error_description: description }, { status: 400 });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return fail("invalid_client_metadata", "Expected a JSON body");

  const redirectUris: unknown = body.redirect_uris;
  if (!Array.isArray(redirectUris) || redirectUris.length === 0 || redirectUris.length > 10) {
    return fail("invalid_redirect_uri", "redirect_uris must list 1 to 10 URLs");
  }
  if (!redirectUris.every((uri) => typeof uri === "string" && isAllowedRedirect(uri))) {
    return fail("invalid_redirect_uri", "Only Claude callback URLs and localhost are accepted");
  }

  const authMethod = (body.token_endpoint_auth_method ?? "client_secret_basic") as OAuthClient["authMethod"];
  if (!AUTH_METHODS.includes(authMethod)) {
    return fail("invalid_client_metadata", `Unsupported token_endpoint_auth_method: ${authMethod}`);
  }

  const name = typeof body.client_name === "string" ? body.client_name.slice(0, 100) : "MCP client";
  const { clientId, clientSecret } = registerClient({ redirectUris, name, authMethod });

  return Response.json(
    {
      client_id: clientId,
      ...(clientSecret && { client_secret: clientSecret, client_secret_expires_at: 0 }),
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: name,
      redirect_uris: redirectUris,
      token_endpoint_auth_method: authMethod,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
