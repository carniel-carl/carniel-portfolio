import prisma from "@/lib/prisma";
import BlogPostForm from "@/components/admin/BlogPostForm";
import BackButton from "@/components/general/BackButton";

export default async function NewBlogPostPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <BackButton showText />
        <h2 className="text-2xl font-bold">New Blog Post</h2>
      </div>
      <BlogPostForm categories={JSON.parse(JSON.stringify(categories))} />
    </div>
  );
}
