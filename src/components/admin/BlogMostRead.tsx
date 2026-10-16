import routes from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";
import Link from "next/link";

export interface MostReadPost {
  id: string;
  title: string;
  views: number;
  category: { name: string; color: string } | null;
}

/** The most read live posts, ranked, with bars scaled to the leader. */
export default function BlogMostRead({
  posts,
  totalViews,
  className,
}: {
  posts: MostReadPost[];
  /** Views across every live post */
  totalViews: number;
  className?: string;
}) {
  const max = posts[0]?.views ?? 0;

  return (
    <section aria-labelledby="most-read" className={cn("surface overflow-hidden", className)}>
      <header className="flex items-baseline justify-between gap-3 border-b px-4 py-3">
        <h2 id="most-read" className="text-sm font-semibold text-foreground">
          Most read
        </h2>
        <span className="tnum text-xs text-muted-foreground">
          {totalViews.toLocaleString()} {totalViews === 1 ? "view" : "views"} in total
        </span>
      </header>
      <ol className="grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
        {posts.map((post, i) => (
          <li key={post.id} className="min-w-0">
            <Link
              href={routes.admin.blogPreview(post.id)}
              className="flex h-full gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <span className="tnum w-3 pt-px text-[13px] text-muted-foreground">{i + 1}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                  {post.title}
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: post.category?.color ?? "#6b7280" }}
                  />
                  <span className="min-w-0 flex-1 truncate">{post.category?.name ?? "Others"}</span>
                  <span className="tnum inline-flex shrink-0 items-center gap-1">
                    <Eye className="size-3.5" aria-hidden="true" />
                    {post.views.toLocaleString()}
                    <span className="sr-only">{post.views === 1 ? "view" : "views"}</span>
                  </span>
                </span>
                {/* mt-auto keeps the bars on one line when titles wrap differently */}
                <span className="mt-auto block pt-2.5">
                  <span
                    aria-hidden
                    className="admin-bar block h-1 rounded-full bg-accent-ink opacity-70"
                    style={{
                      width: `${Math.max(4, (post.views / max) * 100)}%`,
                      animationDelay: `${i * 40}ms`,
                    }}
                  />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
