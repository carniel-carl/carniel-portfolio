// Learning series: ordered courses of posts ("episodes"). Ordering helpers
// are shared by the admin actions and the MCP tools; the cached readers feed
// the public blog.
//
// seriesOrder counts every episode, drafts included, so a draft can be slotted
// in anywhere. Public episode numbers count published episodes only, so
// readers never see a gap where an unpublished draft sits.
import { cacheLife, cacheTag } from "next/cache";
import { readingMinutes } from "@/lib/blog/article";
import { levelRange } from "@/lib/blog/levels";
import { CACHE_TAGS } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";

// Posts saved before series existed have no seriesId field at all, which
// Prisma's MongoDB connector doesn't count as null
export const STANDALONE_POST = {
  OR: [{ seriesId: null }, { seriesId: { isSet: false } }],
};

// /blog/series is a static route, so a post with this slug would be unreachable
export const RESERVED_POST_SLUGS = new Set(["series"]);

const EPISODE_ORDER = [{ seriesOrder: "asc" as const }, { createdAt: "asc" as const }];

async function episodeIds(seriesId: string) {
  const rows = await prisma.blogPost.findMany({
    where: { seriesId },
    orderBy: EPISODE_ORDER,
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

async function writeOrder(seriesId: string, ids: string[]) {
  await prisma.$transaction(
    ids.map((id, i) =>
      prisma.blogPost.update({ where: { id }, data: { seriesId, seriesOrder: i + 1 } }),
    ),
  );
}

/**
 * Moves a post into `seriesId` at `position` (1-based among all episodes,
 * drafts included) and renumbers the series. Without a position, a post
 * already in the series keeps its place and a new one goes last. A null
 * series takes the post out of its series.
 */
export async function placeInSeries(postId: string, seriesId: string | null, position?: number) {
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: { seriesId: true },
  });
  if (!post) throw new Error("Post not found");
  const previous = post.seriesId ?? null;

  if (seriesId) {
    const exists = await prisma.series.findUnique({ where: { id: seriesId }, select: { id: true } });
    if (!exists) throw new Error("Series not found");

    const ids = await episodeIds(seriesId);
    const currentIndex = ids.indexOf(postId);
    const others = ids.filter((id) => id !== postId);
    const at = position
      ? Math.min(Math.max(0, Math.trunc(position) - 1), others.length)
      : currentIndex >= 0
        ? currentIndex
        : others.length;
    others.splice(at, 0, postId);
    await writeOrder(seriesId, others);
  } else if (previous) {
    await prisma.blogPost.update({
      where: { id: postId },
      data: { seriesId: null, seriesOrder: null },
    });
  }

  // Close the gap the post left behind
  if (previous && previous !== seriesId) {
    await writeOrder(previous, await episodeIds(previous));
  }
}

/** Saves a full episode order from the admin; `ids` must be exactly the series' episodes. */
export async function reorderEpisodes(seriesId: string, ids: string[]) {
  const current = await episodeIds(seriesId);
  const same = ids.length === current.length && new Set(ids).size === ids.length && ids.every((id) => current.includes(id));
  if (!same) throw new Error("The episode list changed. Refresh and try again.");
  await writeOrder(seriesId, ids);
}

/** Renumbers a series 1..n, e.g. after one of its episodes is deleted. */
export async function compactSeries(seriesId: string) {
  await writeOrder(seriesId, await episodeIds(seriesId));
}

// ─── Public readers ─────────────────────────────────────────────────────────

export type SeriesEpisode = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  level: string | null;
  published: boolean;
  publishedAt: Date | null;
  readingMinutes: number;
  /** 1-based reading position */
  number: number;
};

export type SeriesWithEpisodes = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  completed: boolean;
  updatedAt: Date;
  episodes: SeriesEpisode[];
};

/** A series and its episodes in reading order. Uncached: the admin preview passes includeDrafts. */
export async function loadSeries(
  where: { id: string } | { slug: string },
  { includeDrafts = false } = {},
): Promise<SeriesWithEpisodes | null> {
  const series = await prisma.series.findUnique({
    where,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      coverImage: true,
      completed: true,
      updatedAt: true,
      posts: {
        where: includeDrafts ? {} : { published: true },
        orderBy: EPISODE_ORDER,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          level: true,
          published: true,
          publishedAt: true,
          content: true,
        },
      },
    },
  });
  if (!series) return null;

  const { posts, ...rest } = series;
  return {
    ...rest,
    episodes: posts.map(({ content, ...post }, i) => ({
      ...post,
      readingMinutes: readingMinutes(content),
      number: i + 1,
    })),
  };
}

/** Published episodes of a series, for the episode navigator on a post. */
export async function getPublishedSeries(where: { id: string } | { slug: string }) {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  const series = await loadSeries(where);
  return series && series.episodes.length > 0 ? series : null;
}

export type SeriesSummary = Awaited<ReturnType<typeof getSeriesList>>[number];

/** Every series with at least one published episode, most recently updated first. */
export async function getSeriesList() {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  const rows = await prisma.series.findMany({
    where: { posts: { some: { published: true } } },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      coverImage: true,
      completed: true,
      updatedAt: true,
      posts: {
        where: { published: true },
        orderBy: EPISODE_ORDER,
        select: {
          slug: true,
          level: true,
          content: true,
          publishedAt: true,
          category: { select: { slug: true } },
        },
      },
    },
  });

  return rows
    .map(({ posts, ...series }) => {
      const latest = posts.reduce<Date | null>(
        (max, p) => (p.publishedAt && (!max || p.publishedAt > max) ? p.publishedAt : max),
        null,
      );
      return {
        ...series,
        episodeCount: posts.length,
        totalMinutes: posts.reduce((sum, p) => sum + readingMinutes(p.content), 0),
        levels: levelRange(posts.map((p) => p.level)),
        firstEpisodeSlug: posts[0].slug,
        episodeSlugs: posts.map((p) => p.slug),
        categorySlugs: [...new Set(posts.map((p) => p.category.slug))],
        latestEpisodeAt: latest ?? series.updatedAt,
      };
    })
    .sort((a, b) => b.latestEpisodeAt.getTime() - a.latestEpisodeAt.getTime());
}
