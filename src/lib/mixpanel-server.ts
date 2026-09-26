import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";

const PROJECT_ID = process.env.MIXPANEL_PROJECT_ID;
const SA_USERNAME = process.env.MIXPANEL_SERVICE_ACCOUNT_USERNAME;
const SA_SECRET = process.env.MIXPANEL_SERVICE_ACCOUNT_SECRET;

function getAuthHeader() {
  return `Basic ${Buffer.from(`${SA_USERNAME}:${SA_SECRET}`).toString("base64")}`;
}

function formatDate(date: Date) {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

export function getDateRange(days: number = 30) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from_date: formatDate(from), to_date: formatDate(to) };
}

type EventCount = { event: string; count: number };
type LocationData = { country: string; region: string; count: number };
type BlogPostData = { slug: string; title: string; count: number };
type SocialClickData = { platform: string; count: number };
type ProjectClickData = {
  project: string;
  live_clicks: number;
  code_clicks: number;
  total: number;
};

type RawEvent = {
  event: string;
  properties: Record<string, unknown>;
};

async function exportEvents(
  fromDate: string,
  toDate: string,
  events?: string[],
): Promise<RawEvent[]> {
  "use cache: remote";
  cacheTag(CACHE_TAGS.analytics);
  cacheLife("hours");
  if (!PROJECT_ID || !SA_USERNAME || !SA_SECRET) return [];

  const url = new URL("https://data-eu.mixpanel.com/api/2.0/export");
  url.searchParams.set("project_id", PROJECT_ID);
  url.searchParams.set("from_date", fromDate);
  url.searchParams.set("to_date", toDate);
  if (events) {
    url.searchParams.set("event", JSON.stringify(events));
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: getAuthHeader(), Accept: "text/plain" },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("Mixpanel export error:", res.status, errorBody);
    return [];
  }

  const text = await res.text();
  if (!text.trim()) return [];

  return text
    .trim()
    .split("\n")
    .map((line) => {
      try {
        return JSON.parse(line) as RawEvent;
      } catch {
        return null;
      }
    })
    .filter((e): e is RawEvent => e !== null);
}

const TRACKED_EVENTS = [
  "Home Viewed",
  "Portfolio Viewed",
  "Blog Page Viewed",
  "Blog Post Viewed",
  "Blog Category Viewed",
  "Resume Downloaded",
  "Social Link Clicked",
  "Project Link Clicked",
];

const PAGE_VIEW_EVENTS = new Set(["Home Viewed", "Portfolio Viewed"]);

/** Count events by a string property, highest first. */
function tally(
  events: RawEvent[],
  pick: (e: RawEvent) => string | undefined,
): [string, number][] {
  const counts = new Map<string, number>();
  for (const e of events) {
    const key = pick(e);
    if (key) counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
}

const pickCountry = (e: RawEvent) =>
  (e.properties.mp_country_code ?? e.properties.$country_code) as string | undefined;
const pickRegion = (e: RawEvent) =>
  (e.properties.$region ?? e.properties.mp_region) as string | undefined;

function eventCountsFrom(events: RawEvent[]): EventCount[] {
  const counts = new Map(tally(events, (e) => e.event));
  return TRACKED_EVENTS.map((event) => ({ event, count: counts.get(event) || 0 }));
}

function locationsFrom(events: RawEvent[]): LocationData[] {
  const views = events.filter((e) => PAGE_VIEW_EVENTS.has(e.event));
  return tally(views, pickCountry).map(([country, count]) => ({ country, region: "", count }));
}

function regionsFrom(events: RawEvent[]): LocationData[] {
  const views = events.filter((e) => PAGE_VIEW_EVENTS.has(e.event));
  return tally(views, pickRegion).map(([region, count]) => ({ country: "", region, count }));
}

function socialClicksFrom(events: RawEvent[]): SocialClickData[] {
  const clicks = events.filter((e) => e.event === "Social Link Clicked");
  return tally(clicks, (e) => e.properties.platform as string | undefined).map(
    ([platform, count]) => ({ platform, count }),
  );
}

function topBlogPostsFrom(events: RawEvent[]): BlogPostData[] {
  const views = events.filter((e) => e.event === "Blog Post Viewed");
  return tally(views, (e) => e.properties.slug as string | undefined)
    .slice(0, 10)
    .map(([slug, count]) => ({ slug, title: slug, count }));
}

function topProjectsFrom(events: RawEvent[]): ProjectClickData[] {
  const clicks = events.filter((e) => e.event === "Project Link Clicked");
  return tally(clicks, (e) => e.properties.project as string | undefined)
    .slice(0, 10)
    .map(([project, total]) => ({ project, live_clicks: 0, code_clicks: 0, total }));
}

/**
 * Everything the analytics page needs from ONE raw export.
 * The export API is rate limited, so avoid one request per chart.
 */
export async function getAnalyticsSnapshot(days: number = 30) {
  const { from_date, to_date } = getDateRange(days);
  const events = await exportEvents(from_date, to_date, TRACKED_EVENTS);
  return {
    from_date,
    to_date,
    eventCounts: eventCountsFrom(events),
    locations: locationsFrom(events),
    regions: regionsFrom(events),
    socialClicks: socialClicksFrom(events),
    topPosts: topBlogPostsFrom(events),
    topProjects: topProjectsFrom(events),
  };
}
