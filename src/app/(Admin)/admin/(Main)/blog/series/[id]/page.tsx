import SeriesEditor from "@/components/admin/SeriesEditor";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import { STANDALONE_POST } from "@/lib/blog/series";
import prisma from "@/lib/prisma";
import routes from "@/lib/routes";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Edit series" };

export default async function EditSeriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{24}$/i.test(id)) notFound();

  const [series, standalone] = await Promise.all([
    prisma.series.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverImage: true,
        completed: true,
        posts: {
          orderBy: [{ seriesOrder: "asc" }, { createdAt: "asc" }],
          select: { id: true, title: true, slug: true, published: true, level: true },
        },
      },
    }),
    // The picker searches on demand; this only decides whether to offer it
    prisma.blogPost.findFirst({ where: STANDALONE_POST, select: { id: true } }),
  ]);

  if (!series) notFound();
  const { posts, ...details } = series;

  return (
    <>
      <AdminPageHeader
        title={series.title}
        description="Episodes read in this order. Drafts stay hidden until you publish them."
        backHref={routes.admin.blogSeries}
        backLabel="Series"
        className="pb-4"
      />
      <SeriesEditor series={details} episodes={posts} hasStandalonePosts={!!standalone} />
    </>
  );
}
