import { cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import Link from "next/link";
import { Metadata } from "next";
import BlogCard from "@/components/blog/BlogCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog | Chimezie's Portfolio",
  description: "Read my latest blog posts",
};

const POSTS_PER_PAGE = 6;

async function getPosts(page: number, limit: number, categorySlug?: string) {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  const where = {
    published: true,
    ...(categorySlug && {
      category: { slug: categorySlug },
    }),
  };

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
        category: { select: { name: true, slug: true } },
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
    select: { name: true, slug: true },
  });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const categorySlug = params.category || undefined;

  const [{ posts, total }, categories] = await Promise.all([
    getPosts(page, POSTS_PER_PAGE, categorySlug),
    getCategories(),
  ]);

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  const buildUrl = (p: number, cat?: string) => {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (cat) params.set("category", cat);
    const qs = params.toString();
    return qs ? `/blog?${qs}` : "/blog";
  };

  return (
    <div className="w-[90%] max-w-4xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8 font-nunito">Blog</h1>

      {/* Scrollable category tabs */}
      <div className="mb-8 -mx-1 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 px-1 pb-2 min-w-max">
          <Link href="/blog">
            <Button
              variant={!categorySlug ? "default" : "outline"}
              size="sm"
              className="rounded-full"
            >
              All
            </Button>
          </Link>
          {categories.map((cat) => (
            <Link key={cat.slug} href={buildUrl(1, cat.slug)}>
              <Button
                variant={categorySlug === cat.slug ? "default" : "outline"}
                size="sm"
                className="rounded-full"
              >
                {cat.name}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">
            {categorySlug
              ? "No posts in this category yet."
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
                <Link href={buildUrl(page - 1, categorySlug)}>
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
                <Link href={buildUrl(page + 1, categorySlug)}>
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
    </div>
  );
}
