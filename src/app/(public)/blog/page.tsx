import { cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import Link from "next/link";
import { Metadata } from "next";
import BlogCard from "@/components/blog/BlogCard";
import BlogSearch from "@/components/blog/BlogSearch";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { getContrastColor } from "@/lib/utils";
import PageTracker from "@/components/analytics/PageTracker";
import routes from "@/lib/routes";

export const metadata: Metadata = {
  title: "Blog | Chimezie's Portfolio",
  description: "Read my latest blog posts",
};

const POSTS_PER_PAGE = 6;

async function getPosts(
  page: number,
  limit: number,
  categorySlug?: string,
  tag?: string,
  search?: string,
) {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  let where: Record<string, unknown>;

  if (search) {
    const words = search.split(/\s+/).filter(Boolean);
    where = {
      published: true,
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: words } },
        { category: { name: { contains: search, mode: "insensitive" } } },
        ...words.map((word) => ({
          title: { contains: word, mode: "insensitive" as const },
        })),
      ],
    };
  } else {
    where = {
      published: true,
      ...(categorySlug && { category: { slug: categorySlug } }),
      ...(tag && { tags: { has: tag } }),
    };
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
        tags: true,
        category: { select: { name: true, slug: true, color: true } },
        author: { select: { name: true } },
      },
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { posts, total };
}

async function getCategories() {
  "use cache";
  cacheTag(CACHE_TAGS.categories);
  cacheLife("max");

  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { name: true, slug: true, color: true },
  });
}

async function getTotalPublishedCount() {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  return prisma.blogPost.count({ where: { published: true } });
}

const buildUrl = (p: number, cat?: string, t?: string, s?: string) => {
  const params = new URLSearchParams();
  if (p > 1) params.set("page", String(p));
  if (s) params.set("search", s);
  if (cat) params.set("category", cat);
  if (t) params.set("tag", t);
  const qs = params.toString();
  return qs ? `${routes.public.blog}?${qs}` : routes.public.blog;
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    category?: string;
    tag?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const categorySlug = params.category || undefined;
  const tag = params.tag || undefined;
  const search = params.search || undefined;

  const [{ posts, total }, categories, totalPublished] = await Promise.all([
    getPosts(page, POSTS_PER_PAGE, categorySlug, tag, search),
    getCategories(),
    getTotalPublishedCount(),
  ]);

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  return (
    <div className="w-[90%] max-w-4xl mx-auto py-12">
      <PageTracker event="Blog Page Viewed" />
      {categorySlug && (
        <PageTracker
          key={categorySlug}
          event="Blog Category Viewed"
          properties={{ category: categorySlug }}
        />
      )}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-nunito">Blog</h1>
        {totalPublished > 0 && <BlogSearch />}
      </div>

      {totalPublished > 0 && (
        <>
          {search ? (
            <div className="mb-8 flex items-center gap-3">
              <span className="text-muted-foreground">
                Search results for: &ldquo;{search}&rdquo;
              </span>
              <Link href={routes.public.blog}>
                <Button variant="outline" size="sm" className="rounded-full">
                  <X className="size-3.5 mr-1" />
                  Clear
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Scrollable category tabs */}
              <div className="mb-8 -mx-1 overflow-x-auto scrollbar-none">
                <div className="flex gap-2 px-1 pb-2 min-w-max">
                  <Link href={routes.public.blog}>
                    <Button
                      variant={!categorySlug ? "default" : "outline"}
                      size="sm"
                      className="rounded-full"
                    >
                      All
                    </Button>
                  </Link>
                  {categories.map((cat) => (
                    <Link key={cat.slug} href={buildUrl(1, cat.slug, tag)}>
                      <Button
                        variant={
                          categorySlug === cat.slug ? "default" : "outline"
                        }
                        size="sm"
                        className="rounded-full border hover:!text-black hover:bg-[var(--cat-color)] hover:border-[var(--cat-color)] transition-colors"
                        style={
                          (categorySlug === cat.slug
                            ? {
                                backgroundColor: cat.color,
                                color: getContrastColor(cat.color),
                                borderColor: cat.color,
                              }
                            : {
                                borderColor: cat.color,
                                color: cat.color,
                                "--cat-color": cat.color,
                              }) as React.CSSProperties
                        }
                      >
                        {cat.name}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>

              {tag && (
                <div className="mb-6 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Filtered by tag:
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">
                    {tag}
                    <Link href={buildUrl(1, categorySlug)}>
                      <X className="size-3.5 hover:text-destructive cursor-pointer" />
                    </Link>
                  </span>
                </div>
              )}
            </>
          )}
        </>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">
            {totalPublished === 0
              ? "No posts yet. Check back soon!"
              : search
                ? "No posts match your search."
                : categorySlug
                  ? "No posts in this category yet."
                  : tag
                    ? "No posts with this tag yet."
                    : "No posts yet. Check back soon!"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-8 md:grid-cols-2">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              {page > 1 ? (
                <Link
                  href={buildUrl(page - 1, categorySlug, tag, search)}
                  prefetch={false}
                >
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="size-4 mr-1" />
                    Previous
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="size-4 mr-1" />
                  Previous
                </Button>
              )}

              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>

              {page < totalPages ? (
                <Link
                  href={buildUrl(page + 1, categorySlug, tag, search)}
                  prefetch={false}
                >
                  <Button variant="outline" size="sm">
                    Next
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Next
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* <BlogSearch /> */}
    </div>
  );
}
