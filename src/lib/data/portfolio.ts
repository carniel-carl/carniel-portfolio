import prisma from "@/lib/prisma";
import { cacheTag, cacheLife } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ProjectDataType } from "@/types/project";

export async function getAbout() {
  "use cache: remote";
  cacheTag(CACHE_TAGS.about);
  cacheLife("max");

  const about = await prisma.about.findFirst();

  return about
    ? {
        bio: about.bio,
        profilePicUrl: about.profilePicUrl,
        resumeUrl: about.resumeUrl,
      }
    : null;
}

export async function getProjects(): Promise<{
  featured: ProjectDataType[];
  other: ProjectDataType[];
}> {
  "use cache: remote";
  cacheTag(CACHE_TAGS.projects);
  cacheLife("max");

  const featured = await prisma.project.findMany({
    where: { featured: true, visible: { not: false } },
    orderBy: { order: "asc" },
  });
  const other = await prisma.project.findMany({
    where: { featured: false, visible: { not: false } },
    orderBy: { order: "asc" },
  });

  const mapProject = (p: (typeof featured)[number]) => ({
    name: p.name,
    tag: p.tag || undefined,
    description: p.description,
    img: p.img,
    live: p.live || undefined,
    code: p.code || undefined,
    stack: p.stack,
  });

  return {
    featured: featured.map(mapProject),
    other: other.map(mapProject),
  };
}

export async function getSkills() {
  "use cache: remote";
  cacheTag(CACHE_TAGS.skills);
  cacheLife("max");

  const skills = await prisma.skill.findMany({ orderBy: { order: "asc" } });

  return skills.map((s) => ({
    id: s.id,
    title: s.title,
    iconName: s.iconName,
  }));
}

export async function getLatestPosts(limit = 3) {
  "use cache: remote";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  return prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      category: { select: { name: true } },
    },
  });
}

export async function getPublishedPostCount() {
  "use cache: remote";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  return prisma.blogPost.count({ where: { published: true } });
}

export type LatestPost = Awaited<ReturnType<typeof getLatestPosts>>[number];
