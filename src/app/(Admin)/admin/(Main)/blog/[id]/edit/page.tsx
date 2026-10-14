import BlogPostForm from "@/components/admin/BlogPostForm";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import StatusPill from "@/components/admin/ui/StatusPill";
import { getSeriesOptions } from "@/lib/blog/series-options";
import prisma from "@/lib/prisma";
import routes from "@/lib/routes";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [post, categories, series] = await Promise.all([
    prisma.blogPost.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        author: { select: { name: true } },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getSeriesOptions(),
  ]);

  if (!post) notFound();

  return (
    <>
      <AdminPageHeader
        title="Edit post"
        backHref={routes.admin.blog}
        backLabel="Blog"
        className="mx-auto w-full max-w-4xl pb-4"
        actions={<StatusPill published={post.published} />}
      />
      <BlogPostForm
        initialData={JSON.parse(JSON.stringify(post))}
        isEdit
        categories={JSON.parse(JSON.stringify(categories))}
        series={series}
      />
    </>
  );
}
