// Absolute origin for canonical URLs, Open Graph tags and structured data.
// Set NEXT_PUBLIC_SITE_URL in production; Vercel's production domain is the fallback.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

export const SITE_NAME = "Chimezie's Portfolio";
export const AUTHOR_NAME = "Chimezie";

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
