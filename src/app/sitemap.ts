import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import routes from "@/lib/routes";
import { SITE_URL } from "@/lib/site";
import { getProjectSlugs } from "@/lib/data/portfolio";

// Rebuilt whenever a post is published or edited (the blog cache tag)
async function getPublishedPosts() {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  return prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: { slug: true, updatedAt: true },
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, projects] = await Promise.all([
    getPublishedPosts(),
    getProjectSlugs(),
  ]);
  const latestPost = posts[0]?.updatedAt;

  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    {
      url: `${SITE_URL}${routes.public.portfolio}`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...projects.map((project) => ({
      url: `${SITE_URL}${routes.public.work(project.slug)}`,
      lastModified: project.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${SITE_URL}${routes.public.blog}`,
      lastModified: latestPost,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...posts.map((post) => ({
      url: `${SITE_URL}${routes.public.blogPost(post.slug)}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${SITE_URL}${routes.public.privacy}`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
