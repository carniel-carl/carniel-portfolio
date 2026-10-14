import { createHash, timingSafeEqual } from "node:crypto";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

// Single shared secret (MCP_API_KEY) for the /api/mcp endpoint. Clients that
// can set request headers send `Authorization: Bearer <key>` or
// `x-api-key: <key>`; clients that only take a URL (some Claude connector
// setups) can append `?token=<key>` instead.

const digest = (value: string) => createHash("sha256").update(value).digest();

export function verifyMcpToken(
  req: Request,
  bearerToken?: string,
): AuthInfo | undefined {
  const expected = process.env.MCP_API_KEY;
  // Unset key means the endpoint is off, not open
  if (!expected || expected.length < 32) return undefined;

  const token =
    bearerToken ||
    req.headers.get("x-api-key") ||
    new URL(req.url).searchParams.get("token");
  if (!token) return undefined;

  // Compare fixed-length hashes so neither length nor content leaks via timing
  if (!timingSafeEqual(digest(token), digest(expected))) return undefined;

  return { token, clientId: "portfolio-agent", scopes: ["blog:draft"] };
}
