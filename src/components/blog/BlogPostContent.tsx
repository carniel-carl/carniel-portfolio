"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getContrastColor } from "@/lib/utils";
import parse from "html-react-parser";
import DOMPurify from "isomorphic-dompurify";

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

interface BlogPostContentProps {
  post: {
    title: string;
    content: string;
    coverImage: string | null;
    publishedAt: Date | string | null;
    tags: string[];
    category: { name: string; slug: string; color: string } | null;
    author: { name: string | null } | null;
  };
  preview?: boolean;
}

export default function BlogPostContent({
  post,
  preview,
}: BlogPostContentProps) {
  return (
    <article className="w-[90%] max-w-3xl mx-auto py-12">
      {preview && !post.publishedAt && (
        <div className="mb-6 rounded-lg border border-yellow-500/50 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
          Preview Mode — This post is a draft and not yet published.
        </div>
      )}

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
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {post.author?.name && <span>By {post.author.name}</span>}
          {post.publishedAt && (
            <time>
              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}
          {post.category && (
            <Link href={`/blog?category=${post.category.slug}`}>
              <Badge
                className="border-0"
                style={{
                  backgroundColor: post.category.color,
                  color: getContrastColor(post.category.color),
                }}
              >
                {post.category.name}
              </Badge>
            </Link>
          )}
        </div>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {post.tags.map((tag) => (
              <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                <Badge
                  variant="secondary"
                  className="text-xs hover:bg-secondary/80 cursor-pointer"
                >
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </header>

      <div className="tiptap-content prose prose-lg dark:prose-invert max-w-none">
        {parse(DOMPurify.sanitize(post.content, { ALLOWED_TAGS, ALLOWED_ATTR }))}
      </div>
    </article>
  );
}
