"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

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

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
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
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt,
      coverImage: data.coverImage,
      published: data.published,
      publishedAt,
    },
  });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  return post;
}

export async function deleteBlogPost(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await prisma.blogPost.delete({ where: { id } });
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}
