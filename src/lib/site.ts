// Absolute origin for canonical URLs, Open Graph tags and structured data.
// Set NEXT_PUBLIC_SITE_URL in production; Vercel's production domain is the fallback.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

export const SITE_NAME = "Chimezie Carniel";
export const SITE_TITLE = `${SITE_NAME} · Web & mobile developer`;
// Child metadata replaces the parent's openGraph object instead of merging,
// so every page spreads this in rather than relying on the root layout
export const BASE_OPEN_GRAPH = {
  type: "website",
  siteName: SITE_NAME,
  locale: "en_US",
} as const;
export const SITE_DESCRIPTION =
  "Chimezie (Carniel) is a web and mobile developer building fast, accessible apps with React, Next.js and React Native.";
// Public byline for the blog (the admin account name is not shown)
export const AUTHOR_NAME = "Carniel";

// Filename recruiters get when downloading the resume from /resume
export const RESUME_FILENAME = "NMUGHA CHIMEZIE CARNIEL Resume.pdf";
export const RESUME_PATH = "/resume";

// Plain-text summary for meta descriptions (~155 chars is what search results show)
export function toMetaDescription(html: string, max = 155) {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&[a-z#0-9]+;/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  const cut = text.lastIndexOf(" ", max - 1);
  return `${text.slice(0, cut > 0 ? cut : max - 1)}…`;
}
