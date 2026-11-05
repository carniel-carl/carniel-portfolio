"use server";

import { auth } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { projectSlug, toSlug } from "@/lib/projects/slug";

/**
 * Invalidate both the Runtime Cache (use cache: remote) and
 * the CDN/ISR page cache for all pages that display projects.
 */
const invalidateProjectCaches = () => {
  // 1. Runtime Cache: purge the "projects" tag entry
  updateTag(CACHE_TAGS.projects);
  revalidateTag(CACHE_TAGS.projects, "max");

  // 2. CDN/ISR Page Cache: explicitly invalidate every page showing projects
  //    (PPR pages cache the full response at the CDN level separately)
  revalidatePath("/");
  revalidatePath("/portfolio");
  revalidatePath("/work/[slug]", "page");
};

/**
 * Slug for /work/[slug]: the admin's choice or the name, made unique against
 * every other project's effective slug (stored or derived from its name).
 */
async function uniqueSlug(input: { slug?: string; name: string }, excludeId?: string) {
  const base = toSlug(input.slug?.trim() || input.name);
  const others = await prisma.project.findMany({
    where: excludeId ? { id: { not: excludeId } } : undefined,
    select: { slug: true, name: true },
  });
  const taken = new Set(others.map(projectSlug));
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

/** Empty editor output ("<p></p>") counts as no case study. */
const caseStudyHtml = (html?: string) =>
  html && html.replace(/<[^>]*>/g, "").trim() ? html : null;

type ShowcaseInput = {
  platform?: string;
  status?: string;
  role?: string;
  team?: string;
  highlights?: string[];
  videoUrl?: string;
  posterUrl?: string;
  screenshots?: string[];
  appStoreUrl?: string;
  playStoreUrl?: string;
  betaUrl?: string;
};

/**
 * The cover image is optional for mobile projects with their own media: fall
 * back to the video poster, then the first screenshot. Stored in `img` so
 * every consumer (home, admin lists, cards) keeps working unchanged.
 */
function resolveCover(data: { img?: string } & ShowcaseInput) {
  const cover = data.img?.trim();
  if (cover) return cover;
  const isMobile = data.platform === "mobile" || data.platform === "both";
  const fallback = isMobile
    ? data.posterUrl?.trim() || data.screenshots?.find((s) => s.trim())
    : undefined;
  if (!fallback) {
    throw new Error("A cover image is required unless a mobile project has a video or screenshots");
  }
  return fallback;
}

const PLATFORM_VALUES = new Set(["web", "mobile", "both"]);
const STATUS_VALUES = new Set(["live", "beta", "prototype", "internal", "in-development"]);

/** Empty strings become null; lists are trimmed and de-blanked. */
function showcaseData(data: ShowcaseInput) {
  const text = (v?: string) => (v && v.trim() ? v.trim() : null);
  const list = (v?: string[]) => (v ?? []).map((s) => s.trim()).filter(Boolean);
  return {
    platform: data.platform && PLATFORM_VALUES.has(data.platform) ? data.platform : "web",
    status: data.status && STATUS_VALUES.has(data.status) ? data.status : null,
    role: text(data.role),
    team: text(data.team),
    highlights: list(data.highlights),
    videoUrl: text(data.videoUrl),
    posterUrl: text(data.posterUrl),
    screenshots: list(data.screenshots).slice(0, 6),
    appStoreUrl: text(data.appStoreUrl),
    playStoreUrl: text(data.playStoreUrl),
    betaUrl: text(data.betaUrl),
  };
}

/**
 * Within each category (featured/other), ordering invariant:
 *   [visible projects: 0, 1, 2 ...] [invisible projects: N, N+1, ...]
 *
 * These helpers maintain that invariant across all mutations.
 */

/** Get the correct insert position for a project in a category. */
async function getInsertOrder(
  featured: boolean,
  visible: boolean,
  excludeId?: string,
) {
  if (visible) {
    // Insert at end of visible section
    return prisma.project.count({
      where: { featured, visible: true, ...(excludeId && { id: { not: excludeId } }) },
    });
  }
  // Insert at end of all projects in category
  return prisma.project.count({
    where: { featured, ...(excludeId && { id: { not: excludeId } }) },
  });
}

/** Shift projects at or after `order` up by 1 to make room. */
async function makeRoomAtOrder(
  featured: boolean,
  order: number,
  excludeId?: string,
) {
  await prisma.project.updateMany({
    where: {
      featured,
      order: { gte: order },
      ...(excludeId && { id: { not: excludeId } }),
    },
    data: { order: { increment: 1 } },
  });
}

/** Shift projects after `order` down by 1 to close a gap. */
async function closeGapAtOrder(
  featured: boolean,
  order: number,
  excludeId?: string,
) {
  await prisma.project.updateMany({
    where: {
      featured,
      order: { gt: order },
      ...(excludeId && { id: { not: excludeId } }),
    },
    data: { order: { decrement: 1 } },
  });
}

export async function createProject(data: {
  name: string;
  tag?: string;
  description: string;
  img: string;
  mediaType?: string;
  live?: string;
  code?: string;
  stack?: string[];
  featured?: boolean;
  visible?: boolean;
  slug?: string;
  caseStudy?: string;
} & ShowcaseInput) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  if (!data.name || !data.description) {
    throw new Error("Name and description are required");
  }
  const cover = resolveCover(data);

  const isFeatured = data.featured || false;
  const isVisible = data.visible ?? true;

  const insertOrder = await getInsertOrder(isFeatured, isVisible);
  await makeRoomAtOrder(isFeatured, insertOrder);

  const project = await prisma.project.create({
    data: {
      name: data.name,
      tag: data.tag || null,
      description: data.description,
      img: cover,
      mediaType: data.mediaType || "image",
      live: data.live || null,
      code: data.code || null,
      stack: data.stack || [],
      featured: isFeatured,
      visible: isVisible,
      order: insertOrder,
      slug: await uniqueSlug(data),
      caseStudy: caseStudyHtml(data.caseStudy),
      ...showcaseData(data),
    },
  });

  invalidateProjectCaches();
  return project;
}

export async function updateProject(
  id: string,
  data: {
    name: string;
    tag?: string;
    description: string;
    img: string;
    mediaType?: string;
    live?: string;
    code?: string;
    stack?: string[];
    featured?: boolean;
    visible?: boolean;
    slug?: string;
    caseStudy?: string;
  } & ShowcaseInput,
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const existing = await prisma.project.findUnique({
    where: { id },
    select: { featured: true, visible: true, order: true },
  });
  if (!existing) throw new Error("Project not found");

  const newFeatured = data.featured ?? existing.featured;
  const newVisible = data.visible ?? existing.visible;
  const categoryChanged = existing.featured !== newFeatured;
  const visibilityChanged = existing.visible !== newVisible;

  let newOrder = existing.order;

  if (categoryChanged || visibilityChanged) {
    // 1. Remove from current position
    await closeGapAtOrder(existing.featured, existing.order, id);

    // 2. Find correct insert position in target category
    newOrder = await getInsertOrder(newFeatured, newVisible, id);

    // 3. Make room at that position
    await makeRoomAtOrder(newFeatured, newOrder, id);
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      name: data.name,
      tag: data.tag,
      description: data.description,
      img: resolveCover(data),
      mediaType: data.mediaType,
      live: data.live,
      code: data.code,
      stack: data.stack,
      featured: newFeatured,
      visible: newVisible,
      order: newOrder,
      slug: await uniqueSlug(data, id),
      caseStudy: caseStudyHtml(data.caseStudy),
      ...showcaseData(data),
    },
  });

  invalidateProjectCaches();
  return project;
}

export async function deleteProject(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const deleted = await prisma.project.delete({ where: { id } });

  await closeGapAtOrder(deleted.featured, deleted.order);

  invalidateProjectCaches();
}

/**
 * Move a project from its current position to a new position.
 * All other projects shift to fill the gap / make room.
 * Only works within the same category and visibility group.
 */
export async function reorderProject(id: string, newOrder: number) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const project = await prisma.project.findUnique({
    where: { id },
    select: { order: true, featured: true },
  });
  if (!project) throw new Error("Project not found");

  const oldOrder = project.order;
  if (oldOrder === newOrder) return;

  if (newOrder < oldOrder) {
    await prisma.project.updateMany({
      where: {
        featured: project.featured,
        order: { gte: newOrder, lt: oldOrder },
        id: { not: id },
      },
      data: { order: { increment: 1 } },
    });
  } else {
    await prisma.project.updateMany({
      where: {
        featured: project.featured,
        order: { gt: oldOrder, lte: newOrder },
        id: { not: id },
      },
      data: { order: { decrement: 1 } },
    });
  }

  await prisma.project.update({
    where: { id },
    data: { order: newOrder },
  });

  invalidateProjectCaches();
}

/**
 * Saves a drag-and-drop ordering for one category. `visibleIds` is the full
 * list of visible projects in their new order; hidden ones keep their
 * relative order after them, as elsewhere.
 */
export async function reorderProjects(featured: boolean, visibleIds: string[]) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const group = await prisma.project.findMany({
    where: { featured },
    orderBy: { order: "asc" },
    select: { id: true, visible: true },
  });
  const visible = group.filter((p) => p.visible).map((p) => p.id);
  const hidden = group.filter((p) => !p.visible).map((p) => p.id);

  // Reject stale or tampered lists instead of scrambling the order
  const sameSet =
    visibleIds.length === visible.length &&
    new Set(visibleIds).size === visibleIds.length &&
    visibleIds.every((id) => visible.includes(id));
  if (!sameSet) throw new Error("Project list is out of date");

  await prisma.$transaction(
    [...visibleIds, ...hidden].map((id, order) =>
      prisma.project.update({ where: { id }, data: { order } }),
    ),
  );

  invalidateProjectCaches();
}

export async function toggleProjectVisibility(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const project = await prisma.project.findUnique({
    where: { id },
    select: { visible: true, featured: true, order: true },
  });
  if (!project) throw new Error("Project not found");

  const newVisible = !project.visible;

  // 1. Remove from current position
  await closeGapAtOrder(project.featured, project.order, id);

  // 2. Find correct insert position
  const newOrder = await getInsertOrder(project.featured, newVisible, id);

  // 3. Make room
  await makeRoomAtOrder(project.featured, newOrder, id);

  // 4. Update
  await prisma.project.update({
    where: { id },
    data: { visible: newVisible, order: newOrder },
  });

  invalidateProjectCaches();
}
