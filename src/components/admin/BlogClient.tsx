"use client";

import BlogMostRead, { type MostReadPost } from "@/components/admin/BlogMostRead";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import EmptyState from "@/components/admin/ui/EmptyState";
import Pagination from "@/components/admin/ui/Pagination";
import { useActionToast } from "@/components/admin/useActionToast";
import SearchField from "@/components/admin/ui/SearchField";
import SegmentedTabs from "@/components/admin/ui/SegmentedTabs";
import RelativeTime from "@/components/admin/ui/RelativeTime";
import StatusPill from "@/components/admin/ui/StatusPill";
import { useUrlSearch } from "@/components/admin/ui/useUrlSearch";
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
  Layers,
  MoreHorizontal,
  PenSquare,
  Pencil,
  Plus,
  SearchX,
  Tags,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const formatViews = (n: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  updatedAt: string;
  category: { id: string; name: string; color: string } | null;
  author: { name: string | null } | null;
  series?: { id: string; title: string } | null;
  seriesOrder?: number | null;
}

export type BlogFilter = "all" | "live" | "drafts";

const listUrl = (filter: BlogFilter, query: string, page = 1) => {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("status", filter);
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${routes.admin.blog}?${qs}` : routes.admin.blog;
};

/** One page of posts; filtering, search and paging all happen on the server via the URL. */
export default function BlogClient({
  posts,
  views,
  mostRead,
  counts,
  filter,
  query,
  page,
  pageSize,
  total,
}: {
  posts: BlogPost[];
  /** View counts keyed by post id */
  views: Record<string, number>;
  /** Top live posts by views, across every post */
  mostRead: { posts: MostReadPost[]; totalViews: number };
  /** Totals across every post, ignoring the search */
  counts: { all: number; live: number };
  filter: BlogFilter;
  query: string;
  page: number;
  pageSize: number;
  /** Posts matching the current filter and search */
  total: number;
}) {
  const runAction = useActionToast(posts);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const search = useUrlSearch(query, (q) => listUrl(filter, q));

  const liveCount = counts.live;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await runAction(() => deleteBlogPost(deleteTarget.id), {
      loading: "Deleting post…",
      success: "Post deleted",
      error: "Could not delete post",
    });
  };

  return (
    <>
      <AdminPageHeader
        title="Blog"
        description={`${liveCount} live, ${counts.all - liveCount} in draft.`}
        actions={
          <>
            <Link
              href={routes.admin.blogSeries}
              className={cn(buttonVariants({ variant: "outline" }), "hover:bg-muted")}
            >
              <Layers />
              Series
            </Link>
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

      {/* The first block after the header overlaps the band: the most read
          strip when anything has been read, otherwise the list panel */}
      {mostRead.posts.length > 0 && (
        <BlogMostRead posts={mostRead.posts} totalViews={mostRead.totalViews} className="mb-4" />
      )}

      <div className="surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <SegmentedTabs
            value={filter}
            onChange={(f) => search.navigate(listUrl(f, query))}
            options={[
              { value: "all", label: "All", count: counts.all },
              { value: "live", label: "Live", count: liveCount },
              { value: "drafts", label: "Drafts", count: counts.all - liveCount },
            ]}
          />
          <SearchField
            value={search.input}
            onChange={search.setInput}
            placeholder="Search title, category or series"
            className="sm:w-72"
          />
        </div>

        <div className={cn("transition-opacity", search.pending && "opacity-60")} aria-busy={search.pending}>
          {posts.length === 0 ? (
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
              {posts.map((post) => (
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
                      {post.series && (
                        <span className="relative z-10">
                          <Link
                            href={routes.admin.blogSeriesEdit(post.series.id)}
                            className="inline-flex items-center gap-1 font-medium text-foreground/80 hover:text-foreground hover:underline"
                          >
                            <Layers className="size-3" aria-hidden="true" />
                            {post.series.title}
                            {post.seriesOrder ? <span className="tnum"> #{post.seriesOrder}</span> : null}
                          </Link>
                          {" · "}
                        </span>
                      )}
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
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        href={(p) => listUrl(filter, query, p)}
        noun="posts"
        className="mt-4"
      />

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
