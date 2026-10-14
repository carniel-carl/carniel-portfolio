import { CACHE_TAGS } from "@/lib/cache-tags";
import { getAnalyticsSnapshot } from "@/lib/mixpanel-server";
import { cacheLife, cacheTag } from "next/cache";

/** The 30-day snapshot, shared by the dashboard and Analytics so both read one cache entry. */
export async function getAnalyticsData() {
  "use cache";
  cacheTag(CACHE_TAGS.analytics);
  cacheLife("hours");
  return getAnalyticsSnapshot(30);
}
