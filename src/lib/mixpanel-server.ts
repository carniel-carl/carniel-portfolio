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

export async function getEventCounts(
  fromDate: string,
  toDate: string,
): Promise<EventCount[]> {
  const trackedEvents = [
    "Home Viewed",
    "Portfolio Viewed",
    "Blog Page Viewed",
    "Blog Post Viewed",
    "Blog Category Viewed",
    "Resume Downloaded",
    "Social Link Clicked",
    "Project Link Clicked",
  ];

  const rawEvents = await exportEvents(fromDate, toDate, trackedEvents);

  const counts = new Map<string, number>();
  for (const e of rawEvents) {
    counts.set(e.event, (counts.get(e.event) || 0) + 1);
  }

  return trackedEvents.map((event) => ({
    event,
    count: counts.get(event) || 0,
  }));
}

export async function getPortfolioLocations(
  fromDate: string,
  toDate: string,
): Promise<LocationData[]> {
  const rawEvents = await exportEvents(fromDate, toDate, [
    "Home Viewed",
    "Portfolio Viewed",
  ]);

  const countryCounts = new Map<string, number>();
  for (const e of rawEvents) {
    const country = (e.properties.mp_country_code ??
      e.properties.$country_code) as string | undefined;
    if (country) {
      countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
    }
  }

  return Array.from(countryCounts.entries())
    .map(([country, count]) => ({ country, region: "", count }))
    .sort((a, b) => b.count - a.count);
}

export async function getLocationsByRegion(
  fromDate: string,
  toDate: string,
): Promise<LocationData[]> {
  const rawEvents = await exportEvents(fromDate, toDate, [
    "Home Viewed",
    "Portfolio Viewed",
  ]);

  const regionCounts = new Map<string, number>();
  for (const e of rawEvents) {
    const region = (e.properties.$region ?? e.properties.mp_region) as
      | string
      | undefined;
    if (region) {
      regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
    }
  }

  return Array.from(regionCounts.entries())
    .map(([region, count]) => ({ country: "", region, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getSocialClicks(
  fromDate: string,
  toDate: string,
): Promise<SocialClickData[]> {
  const rawEvents = await exportEvents(fromDate, toDate, [
    "Social Link Clicked",
  ]);

  const platformCounts = new Map<string, number>();
  for (const e of rawEvents) {
    const platform = e.properties.platform as string | undefined;
    if (platform) {
      platformCounts.set(platform, (platformCounts.get(platform) || 0) + 1);
    }
  }

  return Array.from(platformCounts.entries())
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getTopBlogPosts(
  fromDate: string,
  toDate: string,
): Promise<BlogPostData[]> {
  const rawEvents = await exportEvents(fromDate, toDate, ["Blog Post Viewed"]);

  const slugCounts = new Map<string, number>();
  for (const e of rawEvents) {
    const slug = e.properties.slug as string | undefined;
    if (slug) {
      slugCounts.set(slug, (slugCounts.get(slug) || 0) + 1);
    }
  }

  return Array.from(slugCounts.entries())
    .map(([slug, count]) => ({ slug, title: slug, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export async function getTopProjects(
  fromDate: string,
  toDate: string,
): Promise<ProjectClickData[]> {
  const rawEvents = await exportEvents(fromDate, toDate, [
    "Project Link Clicked",
  ]);

  const projectCounts = new Map<string, number>();
  for (const e of rawEvents) {
    const project = e.properties.project as string | undefined;
    if (project) {
      projectCounts.set(project, (projectCounts.get(project) || 0) + 1);
    }
  }

  return Array.from(projectCounts.entries())
    .map(([project, total]) => ({
      project,
      live_clicks: 0,
      code_clicks: 0,
      total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}
