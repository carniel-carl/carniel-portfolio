import { createHash, timingSafeEqual } from "node:crypto";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { MCP_SCOPE, verifyAccessToken } from "@/lib/mcp/oauth";

// Two ways into /api/mcp:
// - OAuth access tokens from the admin sign-in flow (lib/mcp/oauth), which is
//   what Claude's connector UI uses
// - The static MCP_API_KEY, for clients that can set headers (Claude Code):
//   `Authorization: Bearer <key>` or `x-api-key: <key>`, or `?token=<key>`

const digest = (value: string) => createHash("sha256").update(value).digest();

export function verifyMcpToken(
  req: Request,
  bearerToken?: string,
): AuthInfo | undefined {
  const expected = process.env.MCP_API_KEY;
  // Unset key means the endpoint is off, not open
  if (!expected || expected.length < 32) return undefined;

  if (bearerToken) {
    const grant = verifyAccessToken(bearerToken);
    if (grant) {
      return { token: bearerToken, clientId: grant.clientId, scopes: [MCP_SCOPE], expiresAt: grant.expiresAt };
    }
  }

  const token =
    bearerToken ||
    req.headers.get("x-api-key") ||
    new URL(req.url).searchParams.get("token");
  if (!token) return undefined;

  // Compare fixed-length hashes so neither length nor content leaks via timing
  if (!timingSafeEqual(digest(token), digest(expected))) return undefined;

  return { token, clientId: "portfolio-agent", scopes: [MCP_SCOPE] };
}
