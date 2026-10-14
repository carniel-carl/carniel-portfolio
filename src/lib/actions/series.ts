"use server";

import { auth } from "@/lib/auth";
import { isLevel } from "@/lib/blog/levels";
import { placeInSeries, reorderEpisodes } from "@/lib/blog/series";
import { CACHE_TAGS } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";
import { toSlug } from "@/lib/projects/slug";
import { revalidatePath, revalidateTag, updateTag } from "next/cache";

// Series pages are built from the blog cache, so every change here clears it
const invalidateSeriesCaches = () => {
  updateTag(CACHE_TAGS.blog);
  revalidateTag(CACHE_TAGS.blog, "max");
  revalidatePath("/blog");
};

async function requireSession() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

type SeriesInput = {
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  completed?: boolean;
};

async function freeSlug(base: string, ignoreId?: string) {
  const slug = toSlug(base);
  const conflict = await prisma.series.findUnique({ where: { slug }, select: { id: true } });
  if (conflict && conflict.id !== ignoreId) throw new Error(`Another series already uses /${slug}`);
  return slug;
}

export async function createSeries(data: SeriesInput) {
  await requireSession();
  if (!data.title.trim()) throw new Error("Title is required");

  const series = await prisma.series.create({
    data: {
      title: data.title.trim(),
      slug: await freeSlug(data.slug || data.title),
      description: data.description?.trim() || null,
      coverImage: data.coverImage || null,
      completed: data.completed ?? false,
    },
    select: { id: true },
  });

  invalidateSeriesCaches();
  return series;
}

export async function updateSeries(id: string, data: SeriesInput) {
  await requireSession();
  if (!data.title.trim()) throw new Error("Title is required");

  await prisma.series.update({
    where: { id },
    data: {
      title: data.title.trim(),
      slug: await freeSlug(data.slug || data.title, id),
      description: data.description?.trim() || null,
      coverImage: data.coverImage || null,
      completed: data.completed ?? false,
    },
  });

  invalidateSeriesCaches();
}

/** Deletes the series only; its episodes stay on the blog as standalone posts. */
export async function deleteSeries(id: string) {
  await requireSession();

  await prisma.blogPost.updateMany({
    where: { seriesId: id },
    data: { seriesId: null, seriesOrder: null },
  });
  await prisma.series.delete({ where: { id } });

  invalidateSeriesCaches();
}

export async function reorderSeriesEpisodes(seriesId: string, postIds: string[]) {
  await requireSession();
  await reorderEpisodes(seriesId, postIds);
  invalidateSeriesCaches();
}

/** Adds an existing post as the last episode. */
export async function addPostToSeries(seriesId: string, postId: string) {
  await requireSession();
  await placeInSeries(postId, seriesId);
  invalidateSeriesCaches();
}

export async function removePostFromSeries(postId: string) {
  await requireSession();
  await placeInSeries(postId, null);
  invalidateSeriesCaches();
}

export async function setEpisodeLevel(postId: string, level: string | null) {
  await requireSession();
  await prisma.blogPost.update({
    where: { id: postId },
    data: { level: isLevel(level) ? level : null },
  });
  invalidateSeriesCaches();
}
