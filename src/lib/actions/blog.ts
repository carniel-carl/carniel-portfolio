"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidateTag, unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export const getCachedPublishedPosts = unstable_cache(
  async () => {
    return prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
      },
    });
  },
  ["published-posts"],
  { tags: [CACHE_TAGS.blog] }
);

export const getCachedPost = unstable_cache(
  async (slug: string) => {
    return prisma.blogPost.findUnique({ where: { slug } });
  },
  ["blog-post"],
  { tags: [CACHE_TAGS.blog] }
);

export const getCachedAllPosts = unstable_cache(
  async () => {
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
    });
    return JSON.parse(JSON.stringify(posts));
  },
  ["all-posts"],
  { tags: [CACHE_TAGS.blog] }
);

export async function createBlogPost(data: {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  published?: boolean;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  if (!data.title || !data.content) {
    throw new Error("Title and content are required");
  }

  let slug = data.slug || slugify(data.title);

  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  const post = await prisma.blogPost.create({
    data: {
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt || null,
      coverImage: data.coverImage || null,
      published: data.published || false,
      publishedAt: data.published ? new Date() : null,
    },
  });

  revalidateTag(CACHE_TAGS.blog, "max");
  return post;
}

export async function updateBlogPost(
  id: string,
  data: {
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    coverImage?: string;
    published?: boolean;
  }
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) throw new Error("Not found");

  // If slug changed, check for conflicts with other posts
  let slug = data.slug;
  if (slug !== existing.slug) {
    const conflict = await prisma.blogPost.findUnique({ where: { slug } });
    if (conflict) {
      slug = `${slug}-${Date.now()}`;
    }
  }

  let publishedAt = existing.publishedAt;
  if (data.published && !existing.publishedAt) {
    publishedAt = new Date();
  }
  if (!data.published) {
    publishedAt = null;
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt,
      coverImage: data.coverImage,
      published: data.published,
      publishedAt,
    },
  });

  revalidateTag(CACHE_TAGS.blog, "max");
  return post;
}

export async function deleteBlogPost(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await prisma.blogPost.delete({ where: { id } });
  revalidateTag(CACHE_TAGS.blog, "max");
}
