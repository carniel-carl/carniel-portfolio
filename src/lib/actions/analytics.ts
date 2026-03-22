"use server";

import { auth } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function refreshAnalytics() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  revalidateTag(CACHE_TAGS.analytics, "max");
}
