import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { readingMinutes } from "@/lib/blog/article";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/image";
import { AUTHOR_NAME } from "@/lib/site";

export const alt = "Blog post by Carniel";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

async function getPostCard(slug: string) {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: {
      title: true,
      content: true,
      published: true,
      category: { select: { name: true, color: true } },
    },
  });
  if (!post?.published) return null;

  return {
    title: post.title,
    minutes: readingMinutes(post.content),
    category: post.category?.name,
    color: post.category?.color,
  };
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostCard(slug);

  // Drafts and missing posts fall back to a generic blog card
  if (!post) {
    return renderOgImage({ eyebrow: "Writing", title: "Notes by Carniel" });
  }

  return renderOgImage({
    eyebrow: post.category ?? "Writing",
    title: post.title,
    meta: [`By ${AUTHOR_NAME}`, `${post.minutes} min read`],
    dotColor: post.color,
  });
}
