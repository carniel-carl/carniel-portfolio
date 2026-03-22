import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getContrastColor } from "@/lib/utils";

interface BlogCardProps {
  post: {
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    publishedAt: Date | string | null;
    category: { name: string; slug: string; color: string } | null;
    author: { name: string | null } | null;
    tags: string[];
  };
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="group relative border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {post.coverImage && (
        <div className="relative w-full h-48">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 relative z-10">
          {post.category && (
            <Badge
              className="text-xs border-0"
              style={{
                backgroundColor: post.category.color,
                color: getContrastColor(post.category.color),
              }}
            >
              {post.category.name}
            </Badge>
          )}
        </div>
        <h2 className="text-xl font-semibold mb-2 group-hover:text-accent transition-colors">
          <Link
            href={`/blog/${post.slug}`}
            className="after:absolute after:inset-0"
          >
            {post.title}
          </Link>
        </h2>
        {post.excerpt && (
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {post.author?.name && <span>{post.author.name}</span>}
          {post.author?.name && post.publishedAt && <span>&middot;</span>}
          {post.publishedAt && (
            <time>
              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}
        </div>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3 relative z-10">
            {post.tags.slice(0, 4).map((tag) => (
              <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                <Badge
                  variant="secondary"
                  className="text-xs hover:bg-secondary/80 cursor-pointer"
                >
                  {tag}
                </Badge>
              </Link>
            ))}
            {post.tags.length > 4 && (
              <span className="text-xs text-muted-foreground">
                +{post.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
