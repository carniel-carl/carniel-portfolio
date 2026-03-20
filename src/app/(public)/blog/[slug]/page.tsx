import { cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import parse from "html-react-parser";
import DOMPurify from "isomorphic-dompurify";

async function getPost(slug: string) {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  return prisma.blogPost.findUnique({ where: { slug } });
}

export async function generateStaticParams() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { slug: true },
  });

  if (!posts.length) return [{ slug: "__placeholder__" }];

  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title} | Blog`,
    description: post.excerpt || post.title,
  };
}

const ALLOWED_TAGS = [
  "b", "i", "em", "strong", "a", "p", "ul", "ol", "li",
  "img", "iframe", "h1", "h2", "h3", "h4", "h5", "h6",
  "br", "blockquote", "code", "pre", "u", "s", "sub", "sup",
  "hr", "table", "thead", "tbody", "tr", "th", "td",
];

const ALLOWED_ATTR = [
  "href", "src", "alt", "width", "height",
  "allowfullscreen", "target", "rel", "class", "style", "id",
];

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post || !post.published) notFound();

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
        {parse(DOMPurify.sanitize(post.content, { ALLOWED_TAGS, ALLOWED_ATTR }))}
      </div>
    </article>
  );
}
