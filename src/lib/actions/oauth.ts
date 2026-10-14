"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { issueCode, parseAuthorizeRequest, type AuthorizeParams } from "@/lib/mcp/oauth";

// Consent decision from /admin/oauth/authorize. The original request rides
// along as hidden fields and is validated again here, never trusted.
export async function decideOAuthRequest(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const params = Object.fromEntries(
    [...formData.entries()].filter(([, value]) => typeof value === "string"),
  ) as AuthorizeParams;

  const parsed = await parseAuthorizeRequest(params);
  if (!parsed.ok) throw new Error(parsed.error);
  const { request } = parsed;

  const target = new URL(request.redirectUri);
  if (params.decision === "approve") {
    target.searchParams.set("code", issueCode(request, session.user.id));
  } else {
    target.searchParams.set("error", "access_denied");
  }
  if (request.state) target.searchParams.set("state", request.state);

  redirect(target.toString());
}
