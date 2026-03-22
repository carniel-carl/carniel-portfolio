import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlogPostContent from "@/components/blog/BlogPostContent";
import PageHeader from "@/components/general/PageHeader";
import routes from "@/lib/routes";

export default async function BlogPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect(routes.admin.login);

  const { id } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: {
      category: { select: { name: true, slug: true, color: true } },
      author: { select: { name: true } },
    },
  });

  if (!post) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <PageHeader showBackBtn title="Preview" />
        <Link href={routes.admin.blogEdit(id)} className="ml-auto">
          <Button variant="outline" size="sm">
            <Pencil className="size-3 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="border rounded-lg bg-card">
        <BlogPostContent post={post} preview />
      </div>
    </div>
  );
}
