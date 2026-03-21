import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import BlogPostForm from "@/components/admin/BlogPostForm";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { id },
  });

  if (!post) notFound();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Edit Blog Post</h2>
      <BlogPostForm initialData={JSON.parse(JSON.stringify(post))} isEdit />
    </div>
  );
}
