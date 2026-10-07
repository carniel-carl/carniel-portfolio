"use client";

import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import EmptyState from "@/components/admin/ui/EmptyState";
import SearchField from "@/components/admin/ui/SearchField";
import SegmentedTabs from "@/components/admin/ui/SegmentedTabs";
import RelativeTime from "@/components/admin/ui/RelativeTime";
import StatusPill from "@/components/admin/ui/StatusPill";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteBlogPost } from "@/lib/actions/blog";
import routes from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  ExternalLink,
  Eye,
  MoreHorizontal,
  PenSquare,
  Pencil,
  Plus,
  SearchX,
  Tags,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

const formatViews = (n: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; color: string } | null;
  author: { name: string | null } | null;
}

type Filter = "all" | "live" | "drafts";

export default function BlogClient({
  posts,
  views,
}: {
  posts: BlogPost[];
  /** View counts keyed by post id */
  views: Record<string, number>;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);

  const liveCount = posts.filter((p) => p.published).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (filter === "live" && !p.published) return false;
      if (filter === "drafts" && p.published) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.category?.name.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q)
      );
    });
  }, [posts, filter, query]);

  const shown = filtered.slice(0, visibleCount);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBlogPost(deleteTarget.id);
      toast.success("Post deleted");
      router.refresh();
    } catch {
      toast.error("Could not delete post");
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Blog"
        description={`${liveCount} live, ${posts.length - liveCount} in draft.`}
        actions={
          <>
            <Link
              href={routes.admin.blogCategories}
              className={cn(buttonVariants({ variant: "outline" }), "hover:bg-muted")}
            >
              <Tags />
              Categories
            </Link>
            <Link href={routes.admin.blogNew} className={buttonVariants()}>
              <Plus />
              New post
            </Link>
          </>
        }
      />

      {/* One panel: the first block after the header overlaps the band */}
      <div className="surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <SegmentedTabs
            value={filter}
            onChange={(f) => {
              setFilter(f);
              setVisibleCount(PAGE_SIZE);
            }}
            options={[
              { value: "all", label: "All", count: posts.length },
              { value: "live", label: "Live", count: liveCount },
              { value: "drafts", label: "Drafts", count: posts.length - liveCount },
            ]}
          />
          <SearchField
            value={query}
            onChange={(q) => {
              setQuery(q);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search title, category or excerpt"
            className="sm:w-72"
          />
        </div>

        {shown.length === 0 ? (
          query ? (
            <EmptyState
              icon={SearchX}
              title={`No posts match "${query}"`}
              description="Check the spelling or search a category name."
              className="rounded-none border-0"
            />
          ) : (
            <EmptyState
              icon={PenSquare}
              title={filter === "drafts" ? "No drafts" : filter === "live" ? "Nothing published yet" : "No posts yet"}
              description={
                filter === "drafts"
                  ? "Every post is live. Start a new one when you are ready."
                  : "Write your first post. It stays a draft until you publish it."
              }
              className="rounded-none border-0"
              action={
                <Link href={routes.admin.blogNew} className={buttonVariants({ size: "sm" })}>
                  New post
                </Link>
              }
            />
          )
        ) : (
          <ul className="divide-y">
            {shown.map((post) => (
              <li
                key={post.id}
                className="group relative flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50"
              >
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: post.category?.color ?? "#6b7280" }}
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={routes.admin.blogPreview(post.id)}
                    className="block truncate text-sm font-medium text-foreground after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-[inherit] focus-visible:after:ring-2 focus-visible:after:ring-ring"
                  >
                    {post.title}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {post.category?.name ?? "Others"}
                    <span className="hidden sm:inline">
                      {" "}· {post.author?.name ?? "Unknown author"}
                    </span>
                    {post.published && (
                      <span className="tnum sm:hidden">
                        {" "}· {formatViews(views[post.id] ?? 0)}{" "}
                        {views[post.id] === 1 ? "view" : "views"}
                      </span>
                    )}
                  </p>
                </div>
                {/* Drafts can't be read yet, so they keep the column empty */}
                <span
                  className="tnum hidden w-16 shrink-0 items-center justify-end gap-1.5 text-xs text-muted-foreground sm:flex"
                  aria-label={
                    post.published
                      ? `${views[post.id] ?? 0} ${views[post.id] === 1 ? "view" : "views"}`
                      : undefined
                  }
                >
                  {post.published && (
                    <>
                      <Eye className="size-3.5" aria-hidden="true" />
                      {formatViews(views[post.id] ?? 0)}
                    </>
                  )}
                </span>
                <RelativeTime
                  date={post.updatedAt}
                  className="hidden shrink-0 text-xs text-muted-foreground md:block"
                />
                <StatusPill published={post.published} />
                <div className="relative z-10 flex shrink-0 items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="hidden size-8 text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex"
                  >
                    <Link href={routes.admin.blogEdit(post.id)} aria-label={`Edit ${post.title}`}>
                      <Pencil />
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label={`More actions for ${post.title}`}
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                      <DropdownMenuItem asChild>
                        <Link href={routes.admin.blogEdit(post.id)}>
                          <Pencil className="size-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={routes.admin.blogPreview(post.id)}>
                          <Eye className="size-4" />
                          Preview
                        </Link>
                      </DropdownMenuItem>
                      {post.published && (
                        <DropdownMenuItem asChild>
                          <a href={routes.public.blogPost(post.slug)} target="_blank" rel="noopener">
                            <ExternalLink className="size-4" />
                            View on site
                          </a>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => setDeleteTarget(post)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {filtered.length > shown.length && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            className="hover:bg-muted"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          >
            Show {Math.min(PAGE_SIZE, filtered.length - shown.length)} more
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this post?"
        description={
          <>
            <span className="font-medium text-foreground">{deleteTarget?.title}</span> will be
            removed permanently, including from the public blog.
          </>
        }
        onConfirm={handleDelete}
      />
    </>
  );
}
