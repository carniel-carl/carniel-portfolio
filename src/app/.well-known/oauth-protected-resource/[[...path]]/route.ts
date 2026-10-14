import { getPublicOrigin, metadataCorsOptionsRequestHandler } from "mcp-handler";
import { MCP_SCOPE } from "@/lib/mcp/oauth";

// Protected resource metadata (RFC 9728) for /api/mcp. Clients may ask at the
// root or with the resource path appended (/.well-known/.../api/mcp).

export function GET(req: Request) {
  const origin = getPublicOrigin(req);
  return Response.json(
    {
      resource: `${origin}/api/mcp`,
      authorization_servers: [origin],
      scopes_supported: [MCP_SCOPE],
      bearer_methods_supported: ["header"],
      resource_name: "Carniel Portfolio",
    },
    { headers: { "Access-Control-Allow-Origin": "*" } },
  );
}

export const OPTIONS = metadataCorsOptionsRequestHandler();
