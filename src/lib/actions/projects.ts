"use server";

import { auth } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag, updateTag } from "next/cache";

/**
 * Invalidate both the Runtime Cache (use cache: remote) and
 * the CDN/ISR page cache for all pages that display projects.
 */
const invalidateProjectCaches = () => {
  // 1. Runtime Cache: purge the "projects" tag entry
  updateTag(CACHE_TAGS.projects);
  revalidateTag(CACHE_TAGS.projects, "max");

  // 2. CDN/ISR Page Cache: explicitly invalidate the portfolio page
  //    (PPR pages cache the full response at the CDN level separately)
  revalidatePath("/portfolio");
};

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
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  if (!data.name || !data.description || !data.img) {
    throw new Error("Name, description, and image are required");
  }

  const isFeatured = data.featured || false;
  const isVisible = data.visible ?? true;

  const insertOrder = await getInsertOrder(isFeatured, isVisible);
  await makeRoomAtOrder(isFeatured, insertOrder);

  const project = await prisma.project.create({
    data: {
      name: data.name,
      tag: data.tag || null,
      description: data.description,
      img: data.img,
      mediaType: data.mediaType || "image",
      live: data.live || null,
      code: data.code || null,
      stack: data.stack || [],
      featured: isFeatured,
      visible: isVisible,
      order: insertOrder,
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
  },
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
      img: data.img,
      mediaType: data.mediaType,
      live: data.live,
      code: data.code,
      stack: data.stack,
      featured: newFeatured,
      visible: newVisible,
      order: newOrder,
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
