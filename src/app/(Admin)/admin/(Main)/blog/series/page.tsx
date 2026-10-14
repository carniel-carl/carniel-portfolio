import type { Metadata } from "next";
import { cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import SeriesClient from "@/components/admin/SeriesClient";
import { pageCount, parsePage } from "@/lib/pagination";

export const metadata: Metadata = { title: "Series" };

const PAGE_SIZE = 20;

async function getSeriesPage(query: string, requestedPage: number) {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  const where = query ? { title: { contains: query, mode: "insensitive" as const } } : {};
  const total = await prisma.series.count({ where });
  const page = Math.min(requestedPage, pageCount(total, PAGE_SIZE));

  const rows = await prisma.series.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      completed: true,
      forKids: true,
      updatedAt: true,
    },
  });

  // Live and draft counts for this page only, counted in the database
  const groups = await prisma.blogPost.groupBy({
    by: ["seriesId", "published"],
    where: { seriesId: { in: rows.map((s) => s.id) } },
    _count: { _all: true },
  });
  const countOf = (id: string, published: boolean) =>
    groups.find((g) => g.seriesId === id && g.published === published)?._count._all ?? 0;

  return {
    series: rows.map(({ updatedAt, forKids, ...s }) => ({
      ...s,
      forKids: forKids ?? false,
      updatedAt: updatedAt.toISOString(),
      live: countOf(s.id, true),
      drafts: countOf(s.id, false),
    })),
    page,
    total,
  };
}

export default async function SeriesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";
  const { series, page, total } = await getSeriesPage(query, parsePage(params.page));

  return <SeriesClient series={series} query={query} page={page} pageSize={PAGE_SIZE} total={total} />;
}
