import Image from "next/image";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { getContrastColor, cn } from "@/lib/utils";

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
  variant?: "default" | "lead";
}

export default function BlogCard({ post, variant = "default" }: BlogCardProps) {
  const lead = variant === "lead";
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <article
      className={cn(
        "group relative grid gap-6",
        lead && "md:grid-cols-12 md:items-center md:gap-10",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-[1.25rem] bg-surface",
          lead ? "aspect-[16/10] md:col-span-7" : "aspect-[16/10]",
        )}
      >
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes={lead ? "(max-width: 768px) 100vw, 58vw" : "(max-width: 768px) 100vw, 33vw"}
            className="object-cover transition-transform duration-[1.2s] ease-expo group-hover:scale-[1.05]"
          />
        ) : (
          <div className="grid h-full place-items-center text-foreground/25">
            <PenLine className="size-10" />
          </div>
        )}
      </div>

      <div className={cn("flex flex-col gap-3", lead && "md:col-span-5")}>
        <div className="relative z-10 flex flex-wrap items-center gap-3 text-sm text-foreground/60">
          {post.category && (
            <span
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: post.category.color,
                color: getContrastColor(post.category.color),
              }}
            >
              {post.category.name}
            </span>
          )}
          {date && <time>{date}</time>}
        </div>

        <h2
          className={cn(
            "font-display font-semibold leading-[1.08] tracking-[-0.025em]",
            lead ? "text-4xl md:text-6xl" : "text-2xl md:text-[1.75rem]",
          )}
        >
          <Link
            href={`/blog/${post.slug}`}
            className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-[background-size] duration-700 ease-expo after:absolute after:inset-0 group-hover:bg-[length:100%_2px]"
          >
            {post.title}
          </Link>
        </h2>

        {post.excerpt && (
          <p
            className={cn(
              "leading-relaxed text-foreground/70",
              lead ? "text-lg line-clamp-3" : "line-clamp-2",
            )}
          >
            {post.excerpt}
          </p>
        )}

        {post.author?.name && (
          <p className="text-sm text-foreground/55">By {post.author.name}</p>
        )}

        {post.tags.length > 0 && (
          <div className="relative z-10 mt-1 flex flex-wrap gap-2">
            {post.tags.slice(0, 4).map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className="rounded-full border border-foreground/15 px-3 py-1 text-xs text-foreground/75 transition-colors hover:border-foreground/50 hover:text-foreground"
              >
                {tag}
              </Link>
            ))}
            {post.tags.length > 4 && (
              <span className="self-center text-xs text-foreground/55">
                +{post.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
