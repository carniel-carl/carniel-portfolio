const PROJECT_ID = process.env.MIXPANEL_PROJECT_ID;
const API_SECRET = process.env.MIXPANEL_API_SECRET;

function getAuthHeader() {
  return `Basic ${Buffer.from(`${API_SECRET}:`).toString("base64")}`;
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

async function queryMixpanel(
  endpoint: string,
  params: Record<string, string>,
) {
  if (!PROJECT_ID || !API_SECRET) return null;

  const url = new URL(`https://mixpanel.com/api/2.0/${endpoint}`);
  url.searchParams.set("project_id", PROJECT_ID);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: getAuthHeader(), Accept: "application/json" },
  });

  if (!res.ok) return null;
  return res.json();
}

export async function getEventCounts(
  fromDate: string,
  toDate: string,
): Promise<EventCount[]> {
  const events = [
    "Portfolio Viewed",
    "Blog Page Viewed",
    "Blog Post Viewed",
    "Blog Category Viewed",
    "Resume Downloaded",
    "Social Link Clicked",
    "Project Link Clicked",
  ];

  const data = await queryMixpanel("segmentation", {
    event: JSON.stringify(events),
    from_date: fromDate,
    to_date: toDate,
    type: "general",
  });

  if (!data?.data?.values) return events.map((e) => ({ event: e, count: 0 }));

  return events.map((event) => {
    const values = data.data.values[event] || {};
    const count = Object.values(values).reduce(
      (sum: number, v) => sum + (v as number),
      0,
    );
    return { event, count };
  });
}

export async function getPortfolioLocations(
  fromDate: string,
  toDate: string,
): Promise<LocationData[]> {
  const data = await queryMixpanel("segmentation", {
    event: JSON.stringify(["Portfolio Viewed"]),
    from_date: fromDate,
    to_date: toDate,
    type: "general",
    on: 'properties["$country_code"]',
  });

  if (!data?.data?.values?.["Portfolio Viewed"]) return [];

  const countryData = data.data.values["Portfolio Viewed"];
  const locations: LocationData[] = [];

  for (const [country, dateValues] of Object.entries(countryData)) {
    if (country === "undefined" || !country) continue;
    const count = Object.values(dateValues as Record<string, number>).reduce(
      (sum, v) => sum + v,
      0,
    );
    if (count > 0) {
      locations.push({ country, region: "", count });
    }
  }

  return locations.sort((a, b) => b.count - a.count);
}

export async function getLocationsByRegion(
  fromDate: string,
  toDate: string,
): Promise<LocationData[]> {
  const data = await queryMixpanel("segmentation", {
    event: JSON.stringify(["Portfolio Viewed"]),
    from_date: fromDate,
    to_date: toDate,
    type: "general",
    on: 'properties["$region"]',
  });

  if (!data?.data?.values?.["Portfolio Viewed"]) return [];

  const regionData = data.data.values["Portfolio Viewed"];
  const locations: LocationData[] = [];

  for (const [region, dateValues] of Object.entries(regionData)) {
    if (region === "undefined" || !region) continue;
    const count = Object.values(dateValues as Record<string, number>).reduce(
      (sum, v) => sum + v,
      0,
    );
    if (count > 0) {
      locations.push({ country: "", region, count });
    }
  }

  return locations.sort((a, b) => b.count - a.count);
}

export async function getTopBlogPosts(
  fromDate: string,
  toDate: string,
): Promise<BlogPostData[]> {
  const data = await queryMixpanel("segmentation", {
    event: JSON.stringify(["Blog Post Viewed"]),
    from_date: fromDate,
    to_date: toDate,
    type: "general",
    on: 'properties["slug"]',
  });

  if (!data?.data?.values?.["Blog Post Viewed"]) return [];

  const slugData = data.data.values["Blog Post Viewed"];
  const posts: BlogPostData[] = [];

  for (const [slug, dateValues] of Object.entries(slugData)) {
    if (slug === "undefined" || !slug) continue;
    const count = Object.values(dateValues as Record<string, number>).reduce(
      (sum, v) => sum + v,
      0,
    );
    if (count > 0) {
      posts.push({ slug, title: slug, count });
    }
  }

  return posts.sort((a, b) => b.count - a.count).slice(0, 10);
}

type ProjectClickData = {
  project: string;
  live_clicks: number;
  code_clicks: number;
  total: number;
};

export async function getTopProjects(
  fromDate: string,
  toDate: string,
): Promise<ProjectClickData[]> {
  const data = await queryMixpanel("segmentation", {
    event: JSON.stringify(["Project Link Clicked"]),
    from_date: fromDate,
    to_date: toDate,
    type: "general",
    on: 'properties["project"]',
  });

  if (!data?.data?.values?.["Project Link Clicked"]) return [];

  const projectData = data.data.values["Project Link Clicked"];
  const projects: Map<string, ProjectClickData> = new Map();

  for (const [project, dateValues] of Object.entries(projectData)) {
    if (project === "undefined" || !project) continue;
    const count = Object.values(dateValues as Record<string, number>).reduce(
      (sum, v) => sum + v,
      0,
    );
    if (count > 0) {
      projects.set(project, {
        project,
        live_clicks: 0,
        code_clicks: 0,
        total: count,
      });
    }
  }

  return Array.from(projects.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}
