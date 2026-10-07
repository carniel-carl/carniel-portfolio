import type { Metadata } from "next";
import { cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import BlogClient from "@/components/admin/BlogClient";

export const metadata: Metadata = { title: "Blog" };

async function getPosts() {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { id: true, name: true, color: true } },
      author: { select: { name: true } },
    },
  });

  return JSON.parse(JSON.stringify(posts));
}

// Views change on every read, which never touches the blog tag, so they get
// their own short-lived entry instead of riding on the post list's cache
async function getViewCounts() {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("minutes");

  const rows = await prisma.blogPost.findMany({ select: { id: true, views: true } });
  return Object.fromEntries(rows.map((r) => [r.id, r.views ?? 0]));
}

export default async function BlogAdminPage() {
  const [posts, views] = await Promise.all([getPosts(), getViewCounts()]);
  return <BlogClient posts={posts} views={views} />;
}
