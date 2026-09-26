import BlogPostForm from "@/components/admin/BlogPostForm";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import prisma from "@/lib/prisma";
import routes from "@/lib/routes";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New post" };

export default async function NewBlogPostPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <AdminPageHeader title="New post" backHref={routes.admin.blog} backLabel="Blog" className="pb-4" />
      <BlogPostForm categories={JSON.parse(JSON.stringify(categories))} />
    </>
  );
}
