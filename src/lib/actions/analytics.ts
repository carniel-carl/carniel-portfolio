"use server";

import { auth } from "@/lib/auth";
import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function refreshAnalytics() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // updateTag expires immediately, so the refreshed page shows new numbers
  // instead of serving the stale entry once more.
  updateTag(CACHE_TAGS.analytics);
}
