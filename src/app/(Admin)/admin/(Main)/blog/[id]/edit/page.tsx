import BlogPostForm from "@/components/admin/BlogPostForm";
import PageHeader from "@/components/general/PageHeader";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [post, categories] = await Promise.all([
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
  ]);

  if (!post) notFound();

  return (
    <div className="space-y-6">
      <PageHeader showBackBtn title="Edit Blog Post" />
      <BlogPostForm
        initialData={JSON.parse(JSON.stringify(post))}
        isEdit
        categories={JSON.parse(JSON.stringify(categories))}
      />
    </div>
  );
}
