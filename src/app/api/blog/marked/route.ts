import { NextRequest, NextResponse } from "next/server";
import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { readingMinutes } from "@/lib/blog/article";

// Place marks live in the reader's browser and only know a post's slug. This
// turns those slugs into what "Continue reading" shows, and drops posts that
// were deleted or unpublished since the mark was made.
const MAX_SLUGS = 60;

async function getMarkedPosts(slugs: string[]) {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("hours");

  const posts = await prisma.blogPost.findMany({
    where: { published: true, slug: { in: slugs } },
    select: {
      title: true,
      slug: true,
      coverImage: true,
      content: true,
      category: { select: { name: true, color: true } },
    },
  });

  // Only the read time leaves the server, not the full post body
  return posts.map(({ content, ...post }) => ({ ...post, readingMinutes: readingMinutes(content) }));
}

export async function GET(request: NextRequest) {
  const slugs = [
    ...new Set(
      (request.nextUrl.searchParams.get("slugs") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ]
    .slice(0, MAX_SLUGS)
    .sort();

  if (!slugs.length) return NextResponse.json({ posts: [] });

  return NextResponse.json(
    { posts: await getMarkedPosts(slugs) },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=3600" } },
  );
}
