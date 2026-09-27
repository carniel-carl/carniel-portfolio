import BlogPostContent from "@/components/blog/BlogPostContent";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import StatusPill from "@/components/admin/ui/StatusPill";
import PublishPostButton from "@/components/admin/PublishPostButton";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import routes from "@/lib/routes";
import { cn } from "@/lib/utils";
import { ExternalLink, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = { title: "Preview post" };

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
    <>
      <AdminPageHeader
        title="Preview"
        description="How the post reads on the blog."
        backHref={routes.admin.blog}
        backLabel="Blog"
        actions={
          <>
            <StatusPill published={post.published} />
            {post.published && (
              <a
                href={routes.public.blogPost(post.slug)}
                target="_blank"
                rel="noopener"
                className={cn(buttonVariants({ variant: "outline" }), "hover:bg-muted")}
              >
                <ExternalLink />
                Open live
              </a>
            )}
            <Link
              href={routes.admin.blogEdit(id)}
              className={buttonVariants(post.published ? undefined : { variant: "outline" })}
            >
              <Pencil />
              Edit
            </Link>
            {!post.published && <PublishPostButton id={id} />}
          </>
        }
      />

      <div className="surface overflow-hidden">
        <BlogPostContent post={post} preview />
      </div>
    </>
  );
}
