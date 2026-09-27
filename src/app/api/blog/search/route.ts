import { NextRequest, NextResponse } from "next/server";
import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";

const resultSelect = {
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  publishedAt: true,
  tags: true,
  category: { select: { name: true, color: true } },
} as const;

// Results are cached per normalised query and dropped whenever the blog
// changes, so repeat searches skip the database entirely.
async function searchPosts(q: string) {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("minutes");

  const words = q.split(/\s+/).filter(Boolean);

  return prisma.blogPost.findMany({
    where: {
      published: true,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { excerpt: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
        { tags: { hasSome: words } },
        { category: { name: { contains: q, mode: "insensitive" } } },
        ...words.map((word) => ({
          title: { contains: word, mode: "insensitive" as const },
        })),
      ],
    },
    orderBy: { publishedAt: "desc" },
    take: 8,
    select: resultSelect,
  });
}

// Empty-state suggestions: latest posts plus the most used tags
async function getSuggestions() {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("hours");

  const recent = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take: 30,
    select: resultSelect,
  });

  const counts = new Map<string, number>();
  recent.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
  const tags = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => tag);

  return { posts: recent.slice(0, 4), tags };
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim().toLowerCase().replace(/\s+/g, " ");

  if (request.nextUrl.searchParams.has("suggest")) {
    return NextResponse.json(await getSuggestions());
  }

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  return NextResponse.json({ results: await searchPosts(q.slice(0, 80)) });
}
