import type { Metadata } from "next";
import { cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import BlogClient, { type BlogFilter } from "@/components/admin/BlogClient";
import { pageCount, parsePage } from "@/lib/pagination";

export const metadata: Metadata = { title: "Blog" };

const PAGE_SIZE = 20;

const isFilter = (v: string | undefined): v is BlogFilter => v === "live" || v === "drafts";

async function getPostsPage(filter: BlogFilter, query: string, requestedPage: number) {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  const where = {
    ...(filter !== "all" && { published: filter === "live" }),
    ...(query && {
      OR: [
        { title: { contains: query, mode: "insensitive" as const } },
        { excerpt: { contains: query, mode: "insensitive" as const } },
        { category: { name: { contains: query, mode: "insensitive" as const } } },
        { series: { title: { contains: query, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [total, all, live] = await Promise.all([
    prisma.blogPost.count({ where }),
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { published: true } }),
  ]);
  // Past the end (e.g. after deleting the last post on a page) shows the last page
  const page = Math.min(requestedPage, pageCount(total, PAGE_SIZE));

  const posts = await prisma.blogPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      title: true,
      slug: true,
      published: true,
      updatedAt: true,
      seriesOrder: true,
      category: { select: { id: true, name: true, color: true } },
      author: { select: { name: true } },
      series: { select: { id: true, title: true } },
    },
  });

  return {
    posts: posts.map(({ updatedAt, ...p }) => ({ ...p, updatedAt: updatedAt.toISOString() })),
    page,
    total,
    counts: { all, live },
  };
}

// Views change on every read, which never touches the blog tag, so they get
// their own short-lived entry instead of riding on the post list's cache
async function getViewCounts(ids: string[]) {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("minutes");

  const rows = await prisma.blogPost.findMany({
    where: { id: { in: ids } },
    select: { id: true, views: true },
  });
  return Object.fromEntries(rows.map((r) => [r.id, r.views ?? 0]));
}

export default async function BlogAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const filter = isFilter(params.status) ? params.status : "all";
  const query = params.q?.trim().slice(0, 100) ?? "";

  const { posts, page, total, counts } = await getPostsPage(filter, query, parsePage(params.page));
  const views = await getViewCounts(posts.map((p) => p.id));

  return (
    <BlogClient
      posts={posts}
      views={views}
      counts={counts}
      filter={filter}
      query={query}
      page={page}
      pageSize={PAGE_SIZE}
      total={total}
    />
  );
}
