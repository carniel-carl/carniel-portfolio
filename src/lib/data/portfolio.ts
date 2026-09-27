import prisma from "@/lib/prisma";
import { cacheTag, cacheLife } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ProjectDataType } from "@/types/project";
import type { Project } from "@prisma/client";
import { isAvailability, type ContactInfo } from "@/lib/availability";
import { projectSlug } from "@/lib/projects/slug";

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

// Availability badge, local time and email for the hero, footer and contact
export async function getContactInfo(): Promise<ContactInfo> {
  "use cache: remote";
  cacheTag(CACHE_TAGS.about);
  cacheLife("max");

  const about = await prisma.about.findFirst({
    select: {
      availability: true,
      availabilityNote: true,
      contactEmail: true,
      timezone: true,
    },
  });

  return {
    availability: isAvailability(about?.availability) ? about.availability : null,
    availabilityNote: about?.availabilityNote || null,
    contactEmail: about?.contactEmail || null,
    timezone: about?.timezone || null,
  };
}

// Prisma record -> the shape every project card and page renders
export const toProjectData = (p: Project): ProjectDataType => ({
  slug: projectSlug(p),
  hasCaseStudy: Boolean(p.caseStudy?.trim()),
  name: p.name,
  tag: p.tag || undefined,
  description: p.description,
  img: p.img || p.posterUrl || p.screenshots[0] || "",
  live: p.live || undefined,
  code: p.code || undefined,
  stack: p.stack,
  platform: (p.platform as ProjectDataType["platform"]) || "web",
  status: (p.status as ProjectDataType["status"]) || undefined,
  role: p.role || undefined,
  team: p.team || undefined,
  highlights: p.highlights,
  videoUrl: p.videoUrl || undefined,
  posterUrl: p.posterUrl || undefined,
  screenshots: p.screenshots,
  appStoreUrl: p.appStoreUrl || undefined,
  playStoreUrl: p.playStoreUrl || undefined,
  betaUrl: p.betaUrl || undefined,
});

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


  return {
    featured: featured.map(toProjectData),
    other: other.map(toProjectData),
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
    iconLib: s.iconLib,
    iconSvg: s.iconSvg,
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

export async function getSocialLinks() {
  "use cache: remote";
  cacheTag(CACHE_TAGS.social);
  cacheLife("max");

  const links = await prisma.socialLink.findMany();
  return links.map(({ name, link }) => ({ name, link }));
}

// Visible projects in site order (featured first), for /work pages
async function getProjectRecords() {
  "use cache: remote";
  cacheTag(CACHE_TAGS.projects);
  cacheLife("max");

  const projects = await prisma.project.findMany({
    where: { visible: { not: false } },
    orderBy: [{ featured: "desc" }, { order: "asc" }],
  });
  return projects.map((p) => ({ ...p, slug: projectSlug(p) }));
}

export async function getProjectSlugs() {
  const projects = await getProjectRecords();
  return projects.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt }));
}

// The project plus the next one in order, for the "next project" footer
export async function getProjectBySlug(slug: string) {
  const projects = await getProjectRecords();
  const index = projects.findIndex((p) => p.slug === slug);
  if (index === -1) return null;
  const next = projects.length > 1 ? projects[(index + 1) % projects.length] : null;
  return { project: projects[index], next };
}

export type ProjectRecord = Awaited<ReturnType<typeof getProjectRecords>>[number];
