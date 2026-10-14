import { getPublicOrigin, metadataCorsOptionsRequestHandler } from "mcp-handler";
import { MCP_SCOPE } from "@/lib/mcp/oauth";
import routes from "@/lib/routes";

// OAuth authorization server metadata (RFC 8414) for the MCP connector flow.
// Built from the request origin so preview deployments describe themselves.

export function GET(req: Request) {
  const origin = getPublicOrigin(req);
  return Response.json(
    {
      issuer: origin,
      authorization_endpoint: `${origin}${routes.admin.oauthAuthorize}`,
      token_endpoint: `${origin}/api/oauth/token`,
      registration_endpoint: `${origin}/api/oauth/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
      scopes_supported: [MCP_SCOPE],
      client_id_metadata_document_supported: true,
    },
    { headers: { "Access-Control-Allow-Origin": "*" } },
  );
}

export const OPTIONS = metadataCorsOptionsRequestHandler();
