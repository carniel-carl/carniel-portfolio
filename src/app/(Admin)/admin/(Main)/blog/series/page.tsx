import type { Metadata } from "next";
import { cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import SeriesClient from "@/components/admin/SeriesClient";

export const metadata: Metadata = { title: "Series" };

async function getSeries() {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  const rows = await prisma.series.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      completed: true,
      updatedAt: true,
      posts: { select: { published: true } },
    },
  });

  return rows.map(({ posts, updatedAt, ...s }) => ({
    ...s,
    updatedAt: updatedAt.toISOString(),
    live: posts.filter((p) => p.published).length,
    drafts: posts.filter((p) => !p.published).length,
  }));
}

export default async function SeriesAdminPage() {
  return <SeriesClient series={await getSeries()} />;
}
