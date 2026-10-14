import { cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import Link from "next/link";
import { Metadata } from "next";
import BlogCard from "@/components/blog/BlogCard";
import BlogSearch from "@/components/blog/BlogSearch";
import CategoryPills, { type CategoryPill } from "@/components/blog/CategoryPills";
import { readingMinutes } from "@/lib/blog/article";
import { getSeriesList, STANDALONE_POST } from "@/lib/blog/series";
import SeriesCard from "@/components/blog/series/SeriesCard";
import { BASE_OPEN_GRAPH, ogImage, SITE_NAME } from "@/lib/site";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import PageTracker from "@/components/analytics/PageTracker";
import routes from "@/lib/routes";
import SplitText from "@/components/motion/SplitText";
import { ViewTransition } from "react";
import { blogPageTransition } from "@/lib/blog/view-transitions";

const BLOG_DESCRIPTION =
  "Notes on building for the web and mobile: React, Next.js, React Native, design and the craft in between, by Carniel.";

export const metadata: Metadata = {
  title: "Writing",
  description: BLOG_DESCRIPTION,
  alternates: {
    canonical: "/blog",
    types: { "application/rss+xml": [{ url: "/feed.xml", title: "Writing · Chimezie Carniel" }] },
  },
  openGraph: {
    ...BASE_OPEN_GRAPH,
    url: "/blog",
    title: `Writing · ${SITE_NAME}`,
    description: BLOG_DESCRIPTION,
    images: [ogImage("/images/og/blog.png", "Writing by Carniel")],
  },
  twitter: {
    card: "summary_large_image",
    title: `Writing · ${SITE_NAME}`,
    description: BLOG_DESCRIPTION,
  },
};

const POSTS_PER_PAGE = 6;

async function getPosts(
  skip: number,
  take: number,
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
      // Browsing shows series as one card each instead of every episode;
      // tag filters and search still find individual episodes
      ...(!tag && STANDALONE_POST),
    };
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
        tags: true,
        content: true,
        category: { select: { name: true, slug: true, color: true } },
        author: { select: { name: true } },
        series: { select: { title: true, slug: true } },
      },
    }),
    prisma.blogPost.count({ where }),
  ]);

  // Only the read time leaves the server, not the full post body
  return {
    posts: posts.map(({ content, ...post }) => ({
      ...post,
      readingMinutes: readingMinutes(content),
    })),
    total,
  };
}

async function getCategories() {
  "use cache";
  cacheTag(CACHE_TAGS.categories);
  // Counts change when posts are published, so refresh on blog updates too
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  const rows = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      name: true,
      slug: true,
      color: true,
      _count: { select: { posts: { where: { published: true, ...STANDALONE_POST } } } },
    },
  });
  // A category's count is what its filter shows: standalone posts plus series cards
  const series = await getSeriesList();
  const categories = rows
    .map(({ _count, ...c }) => ({
      ...c,
      count: _count.posts + series.filter((s) => s.categorySlugs.includes(c.slug)).length,
    }))
    .filter((c) => c.count > 0);

  // Alphabetical, but the catch-all "Other(s)" pill always goes last
  const isOther = (c: { name: string; slug: string }) =>
    /^others?$/i.test(c.name.trim()) || /^others?$/i.test(c.slug);
  return [
    ...categories.filter((c) => !isOther(c)),
    ...categories.filter(isOther),
  ];
}

// Refreshed hourly: view counts change without a blog cache invalidation
async function getMostRead() {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("hours");

  return prisma.blogPost.findMany({
    where: { published: true, views: { gt: 0 } },
    orderBy: { views: "desc" },
    take: 4,
    select: {
      title: true,
      slug: true,
      views: true,
      category: { select: { name: true, color: true } },
    },
  });
}

// A "most read" list needs a few posts before it says anything
const MOST_READ_MIN = 3;

async function getTotalPublishedCount() {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  return prisma.blogPost.count({ where: { published: true } });
}

async function getStandaloneCount() {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  return prisma.blogPost.count({ where: { published: true, ...STANDALONE_POST } });
}

// Series cards shown at the top of the first browse page
const SERIES_ON_FEED = 3;

// 1 ... 4 5 6 ... 12: current page, its neighbours and both ends
const pageList = (page: number, total: number): (number | "gap")[] => {
  const pages = new Set([1, total, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ["gap" as const, p] : [p]));
};

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

  const withLead = !categorySlug && !tag && !search;
  const unfiltered = page === 1 && withLead;
  // The lead story sits above the grid, so its page takes one extra post to keep the grid rows full
  const firstPageSize = withLead ? POSTS_PER_PAGE + 1 : POSTS_PER_PAGE;
  const skip = page === 1 ? 0 : firstPageSize + (page - 2) * POSTS_PER_PAGE;
  const take = page === 1 ? firstPageSize : POSTS_PER_PAGE;
  const [{ posts, total }, categories, totalPublished, standaloneCount, allSeries, mostRead] =
    await Promise.all([
      getPosts(skip, take, categorySlug, tag, search),
      getCategories(),
      getTotalPublishedCount(),
      getStandaloneCount(),
      getSeriesList(),
      unfiltered ? getMostRead() : Promise.resolve([]),
    ]);

  // Series sit on the first page when browsing (all posts or one category)
  const browsing = page === 1 && !tag && !search;
  const feedSeries = browsing
    ? categorySlug
      ? allSeries.filter((s) => s.categorySlugs.includes(categorySlug))
      : allSeries.slice(0, SERIES_ON_FEED)
    : [];

  const totalPages =
    total <= firstPageSize ? 1 : 1 + Math.ceil((total - firstPageSize) / POSTS_PER_PAGE);
  // Lead story only on the unfiltered first page
  const showLead = unfiltered && posts.length > 1;
  const [lead, ...rest] = showLead ? posts : [null, ...posts];

  return (
    <ViewTransition
      enter={blogPageTransition}
      exit={blogPageTransition}
      default="none"
    >
      <div className="mx-auto max-w-[1400px] px-4 pb-24 pt-10 md:px-8 md:pb-32 md:pt-16">
        <PageTracker event="Blog Page Viewed" />
        {categorySlug && (
          <PageTracker
            key={categorySlug}
            event="Blog Category Viewed"
            properties={{ category: categorySlug }}
          />
        )}
        <header className="mb-12 flex flex-col gap-8 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-6">
            <SplitText
              as="h1"
              text="Writing"
              by="char"
              className="font-display text-[clamp(4rem,14vw,12rem)] font-semibold leading-[0.85] tracking-[-0.045em]"
            />
            <p className="max-w-[46ch] text-lg text-foreground/70 md:text-xl">
              Notes on building for the web and mobile: React, React Native,
              design and everything in between.
            </p>
          </div>
          {totalPublished > 0 && (
            <div className="w-full md:w-auto md:shrink-0">
              <BlogSearch />
            </div>
          )}
        </header>

        {totalPublished > 0 && (
          <>
            {search ? (
              <div className="mb-10 flex flex-wrap items-center gap-3">
                <span className="text-lg text-foreground/70">
                  {total} {total === 1 ? "result" : "results"} for{" "}
                  <span className="font-medium text-foreground">&ldquo;{search}&rdquo;</span>
                </span>
                <Link
                  href={routes.public.blog}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-foreground/15 px-3.5 text-sm font-medium transition-colors hover:border-foreground/40"
                >
                  <X className="size-3.5" />
                  Clear search
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <CategoryPills
                    items={[
                      {
                        key: "all",
                        label: "All",
                        href: buildUrl(1, undefined, tag),
                        count: standaloneCount + allSeries.length,
                        active: !categorySlug,
                      },
                      ...categories.map<CategoryPill>((cat) => ({
                        key: cat.slug,
                        label: cat.name,
                        href: buildUrl(1, cat.slug, tag),
                        count: cat.count,
                        color: cat.color,
                        active: categorySlug === cat.slug,
                      })),
                    ]}
                  />
                </div>

                {tag && (
                  <div className="mb-8 flex items-center gap-3 text-sm">
                    <span className="text-foreground/60">Tagged</span>
                    <Link
                      href={buildUrl(1, categorySlug)}
                      aria-label={`Remove tag filter ${tag}`}
                      className="group inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-3.5 font-medium text-background transition-transform active:scale-95"
                    >
                      #{tag}
                      <X className="size-3.5 opacity-70 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {posts.length === 0 && feedSeries.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-[1.25rem] border border-dashed border-foreground/20 px-6 py-24 text-center">
            <p className="font-display text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
              {totalPublished === 0 ? "First posts are on the way" : "Nothing found"}
            </p>
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
            {lead && (
              <div className="mb-14 md:mb-20">
                <BlogCard post={lead} variant="lead" />
              </div>
            )}

            {feedSeries.length > 0 && (
              <section aria-labelledby="feed-series" className="mb-14 md:mb-20">
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <h2
                      id="feed-series"
                      className="font-display text-3xl font-semibold tracking-[-0.03em] md:text-4xl"
                    >
                      Series
                    </h2>
                    <p className="text-foreground/65">
                      Learn a topic start to finish, one episode at a time.
                    </p>
                  </div>
                  {!categorySlug && allSeries.length > 0 && (
                    <Link
                      href={routes.public.blogSeries}
                      className="group inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-foreground/15 px-4 text-sm font-medium transition-colors hover:border-foreground/40"
                    >
                      All series
                      <span className="tnum text-foreground/55">{allSeries.length}</span>
                      <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </Link>
                  )}
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {feedSeries.map((s) => (
                    <SeriesCard key={s.id} series={s} />
                  ))}
                </div>
              </section>
            )}
            {feedSeries.length > 0 && rest.some(Boolean) && (
              <h2 className="mb-6 font-display text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                Posts
              </h2>
            )}
            <div className="grid gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => post && <BlogCard key={post.id} post={post} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                aria-label="Pagination"
                className="mt-20 flex items-center justify-center gap-2"
              >
                {page > 1 ? (
                  <Link
                    href={buildUrl(page - 1, categorySlug, tag, search)}
                    prefetch={false}
                    aria-label="Previous page"
                    className="grid size-11 place-items-center rounded-full border border-foreground/15 transition-colors hover:border-foreground/40"
                  >
                    <ChevronLeft className="size-4" />
                  </Link>
                ) : (
                  <span
                    aria-hidden="true"
                    className="grid size-11 place-items-center rounded-full border border-foreground/10 text-foreground/30"
                  >
                    <ChevronLeft className="size-4" />
                  </span>
                )}

                {pageList(page, totalPages).map((p, i) =>
                  p === "gap" ? (
                    <span key={`gap-${i}`} className="px-1 text-foreground/40" aria-hidden="true">
                      &hellip;
                    </span>
                  ) : (
                    <Link
                      key={p}
                      href={buildUrl(p, categorySlug, tag, search)}
                      prefetch={false}
                      aria-current={p === page ? "page" : undefined}
                      aria-label={`Page ${p}`}
                      className={
                        p === page
                          ? "grid size-11 place-items-center rounded-full bg-accent font-mono text-sm font-medium text-accent-on"
                          : "grid size-11 place-items-center rounded-full font-mono text-sm text-foreground/70 transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                      }
                    >
                      {p}
                    </Link>
                  ),
                )}

                {page < totalPages ? (
                  <Link
                    href={buildUrl(page + 1, categorySlug, tag, search)}
                    prefetch={false}
                    aria-label="Next page"
                    className="grid size-11 place-items-center rounded-full border border-foreground/15 transition-colors hover:border-foreground/40"
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                ) : (
                  <span
                    aria-hidden="true"
                    className="grid size-11 place-items-center rounded-full border border-foreground/10 text-foreground/30"
                  >
                    <ChevronRight className="size-4" />
                  </span>
                )}
              </nav>
            )}
          </>
        )}

        {mostRead.length >= MOST_READ_MIN && (
          <section
            aria-labelledby="most-read"
            className="mt-24 grid gap-8 border-t border-foreground/10 pt-12 md:mt-32 md:grid-cols-12 md:pt-16"
          >
            <h2
              id="most-read"
              className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.04em] md:col-span-4"
            >
              Most read
            </h2>
            <ol className="md:col-span-8">
              {mostRead.map((post, i) => (
                <li key={post.slug} className="border-t border-foreground/10 last:border-b">
                  <Link
                    href={routes.public.blogPost(post.slug)}
                    className="group grid grid-cols-[3rem_1fr] items-baseline gap-4 py-6 md:grid-cols-[4rem_1fr_auto]"
                  >
                    <span className="font-mono text-sm text-accent-ink">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex flex-col gap-2">
                      <span className="text-balance font-display text-2xl font-semibold leading-tight tracking-[-0.02em] transition-transform duration-500 ease-expo group-hover:translate-x-2 md:text-3xl">
                        {post.title}
                      </span>
                      {post.category && (
                        <span className="inline-flex items-center gap-2 text-sm text-foreground/60">
                          <span
                            aria-hidden="true"
                            className="size-2 rounded-full"
                            style={{ backgroundColor: post.category.color }}
                          />
                          {post.category.name}
                        </span>
                      )}
                    </span>
                    <span className="col-start-2 font-mono text-sm tabular-nums text-foreground/55 md:col-start-auto">
                      {new Intl.NumberFormat("en", { notation: "compact" }).format(post.views ?? 0)}{" "}
                      {post.views === 1 ? "view" : "views"}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </ViewTransition>
  );
}
