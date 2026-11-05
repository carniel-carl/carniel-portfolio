import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { verifyMcpToken } from "@/lib/mcp/auth";
import { MCP_INSTRUCTIONS, registerBlogTools } from "@/lib/mcp/blog-tools";

// Remote MCP server (Streamable HTTP) at /api/mcp. Connect Claude Cowork,
// Claude Desktop or Claude Code to it to draft blog posts; see the tool
// descriptions in lib/mcp/blog-tools. Requires MCP_API_KEY.

export const maxDuration = 60;

const handler = createMcpHandler(
  (server) => {
    registerBlogTools(server);
  },
  {
    serverInfo: { name: "carniel-portfolio", version: "1.0.0" },
    instructions: MCP_INSTRUCTIONS,
  },
  {
    basePath: "/api",
    maxDuration: 60,
    // SSE needs Redis and is deprecated in the MCP spec; Streamable HTTP only
    disableSse: true,
  },
);

const authHandler = withMcpAuth(handler, verifyMcpToken, { required: true });

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
