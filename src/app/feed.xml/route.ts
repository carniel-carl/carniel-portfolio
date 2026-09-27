import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { sanitizeRichText } from "@/components/content/RichText";
import routes from "@/lib/routes";
import { AUTHOR_NAME, SITE_NAME, SITE_URL, toMetaDescription } from "@/lib/site";

const FEED_LIMIT = 30;

const escapeXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

// CDATA can't contain "]]>", so split it across two sections
const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;

// Built once and rebuilt whenever the blog cache tag is invalidated
async function buildFeed() {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take: FEED_LIMIT,
    select: {
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      tags: true,
      category: { select: { name: true } },
    },
  });

  const items = posts
    .map((post) => {
      const url = `${SITE_URL}${routes.public.blogPost(post.slug)}`;
      const date = (post.publishedAt ?? post.createdAt).toUTCString();
      const summary = post.excerpt?.trim() || toMetaDescription(post.content, 300);
      const categories = [post.category?.name, ...post.tags]
        .filter(Boolean)
        .map((c) => `      <category>${escapeXml(c!)}</category>`)
        .join("\n");
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${date}</pubDate>
      <dc:creator>${escapeXml(AUTHOR_NAME)}</dc:creator>
${categories}
      <description>${escapeXml(summary)}</description>
      <content:encoded>${cdata(sanitizeRichText(post.content))}</content:encoded>
    </item>`;
    })
    .join("\n");

  const lastBuild = (posts[0]?.updatedAt ?? new Date(0)).toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(`Writing · ${SITE_NAME}`)}</title>
    <link>${SITE_URL}${routes.public.blog}</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Notes on building for the web and mobile: React, Next.js, React Native and design, by ${escapeXml(AUTHOR_NAME)}.</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>`;
}

export async function GET() {
  return new Response(await buildFeed(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
