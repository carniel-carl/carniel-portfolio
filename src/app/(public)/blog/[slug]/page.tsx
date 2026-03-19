export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import parse from "html-react-parser";
import DOMPurify from "isomorphic-dompurify";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug },
  });

  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title} | Blog`,
    description: post.excerpt || post.title,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug },
  });

  if (!post || !post.published) {
    notFound();
  }

  return (
    <article className="w-[90%] max-w-3xl mx-auto py-12">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Blog
      </Link>

      {post.coverImage && (
        <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden mb-8">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-3 font-nunito">
          {post.title}
        </h1>
        {post.publishedAt && (
          <time className="text-sm text-muted-foreground">
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        )}
      </header>

      <div className="tiptap-content prose prose-lg dark:prose-invert max-w-none">
        {parse(DOMPurify.sanitize(post.content, {
          ALLOWED_TAGS: [
            "b", "i", "em", "strong", "a", "p", "ul", "ol", "li",
            "img", "iframe", "h1", "h2", "h3", "h4", "h5", "h6",
            "br", "blockquote", "code", "pre", "u", "s", "sub", "sup",
            "hr", "table", "thead", "tbody", "tr", "th", "td",
          ],
          ALLOWED_ATTR: [
            "href", "src", "alt", "width", "height", "allowfullscreen",
            "target", "rel", "class", "style", "id",
          ],
        }))}
      </div>
    </article>
  );
}
