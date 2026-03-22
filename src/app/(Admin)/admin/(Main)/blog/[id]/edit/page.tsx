import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import BlogPostForm from "@/components/admin/BlogPostForm";

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
    <div>
      <h2 className="text-2xl font-bold mb-6">Edit Blog Post</h2>
      <BlogPostForm
        initialData={JSON.parse(JSON.stringify(post))}
        isEdit
        categories={JSON.parse(JSON.stringify(categories))}
      />
    </div>
  );
}
