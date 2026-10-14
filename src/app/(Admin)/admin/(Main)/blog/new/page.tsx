import BlogPostForm from "@/components/admin/BlogPostForm";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import { getSeriesOptions } from "@/lib/blog/series-options";
import prisma from "@/lib/prisma";
import routes from "@/lib/routes";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New post" };

export default async function NewBlogPostPage({
  searchParams,
}: {
  searchParams: Promise<{ series?: string }>;
}) {
  const [{ series: seriesParam }, categories, series] = await Promise.all([
    searchParams,
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getSeriesOptions(),
  ]);
  const defaultSeries = series.find((s) => s.id === seriesParam);

  return (
    <>
      <AdminPageHeader
        title={defaultSeries ? `New episode ${defaultSeries.episodeCount + 1}` : "New post"}
        description={defaultSeries ? `In ${defaultSeries.title}` : undefined}
        backHref={defaultSeries ? routes.admin.blogSeriesEdit(defaultSeries.id) : routes.admin.blog}
        backLabel={defaultSeries ? "Series" : "Blog"}
        className="mx-auto w-full max-w-4xl pb-4"
      />
      <BlogPostForm
        // Remount when switching between "new post" and "new episode of X"
        key={defaultSeries?.id ?? "standalone"}
        categories={JSON.parse(JSON.stringify(categories))}
        series={series}
        defaultSeriesId={defaultSeries?.id}
      />
    </>
  );
}
