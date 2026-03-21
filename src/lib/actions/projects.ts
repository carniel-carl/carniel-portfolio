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

  // Auto-assign order: place new project at the end
  const lastProject = await prisma.project.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const nextOrder = (lastProject?.order ?? -1) + 1;

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
      featured: data.featured || false,
      visible: data.visible ?? true,
      order: nextOrder,
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
      featured: data.featured,
      visible: data.visible,
    },
  });

  invalidateProjectCaches();
  return project;
}

export async function deleteProject(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const deleted = await prisma.project.delete({ where: { id } });

  // Close the gap: shift down all projects that were after the deleted one
  await prisma.project.updateMany({
    where: { order: { gt: deleted.order } },
    data: { order: { decrement: 1 } },
  });

  invalidateProjectCaches();
}

/**
 * Move a project from its current position to a new position.
 * All other projects shift to fill the gap / make room.
 */
export async function reorderProject(id: string, newOrder: number) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const project = await prisma.project.findUnique({
    where: { id },
    select: { order: true },
  });
  if (!project) throw new Error("Project not found");

  const oldOrder = project.order;
  if (oldOrder === newOrder) return;

  if (newOrder < oldOrder) {
    // Moving up: shift projects in [newOrder, oldOrder-1] down by 1
    await prisma.project.updateMany({
      where: {
        order: { gte: newOrder, lt: oldOrder },
        id: { not: id },
      },
      data: { order: { increment: 1 } },
    });
  } else {
    // Moving down: shift projects in [oldOrder+1, newOrder] up by 1
    await prisma.project.updateMany({
      where: {
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
    select: { visible: true },
  });
  if (!project) throw new Error("Project not found");

  await prisma.project.update({
    where: { id },
    data: { visible: !project.visible },
  });

  invalidateProjectCaches();
}
