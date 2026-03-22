import BlogPostForm from "@/components/admin/BlogPostForm";
import PageHeader from "@/components/general/PageHeader";
import prisma from "@/lib/prisma";

export default async function NewBlogPostPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader showBackBtn title="New Blog Post" />
      <BlogPostForm categories={JSON.parse(JSON.stringify(categories))} />
    </div>
  );
}
