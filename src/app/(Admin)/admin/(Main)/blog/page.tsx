import { cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import BlogClient from "@/components/admin/BlogClient";

async function getPosts() {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
  });

  return JSON.parse(JSON.stringify(posts));
}

export default async function BlogAdminPage() {
  const posts = await getPosts();
  return <BlogClient posts={posts} />;
}
