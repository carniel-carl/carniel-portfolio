import Link from "next/link";
import EpisodePager from "@/components/blog/series/EpisodePager";
import SeriesNavigator from "@/components/blog/series/SeriesNavigator";
import { getPublishedSeries, loadSeries } from "@/lib/blog/series";
import routes from "@/lib/routes";

/**
 * The series pieces of an episode page: the kicker above the title, the
 * episode navigator above the body and the previous / next pager below it.
 * Null for standalone posts. The admin preview counts drafts as episodes so a
 * draft shows where it will land.
 */
export async function getEpisodeParts(
  post: { slug: string; seriesId: string | null },
  { preview = false } = {},
) {
  if (!post.seriesId) return null;
  const series = preview
    ? await loadSeries({ id: post.seriesId }, { includeDrafts: true })
    : await getPublishedSeries({ id: post.seriesId });
  if (!series) return null;

  const episodes = series.episodes.map(({ slug, title, number, readingMinutes }) => ({
    slug,
    title,
    number,
    readingMinutes,
  }));
  const current = episodes.find((e) => e.slug === post.slug);
  if (!current) return null;

  const info = { slug: series.slug, title: series.title, completed: series.completed };

  return {
    series: info,
    forKids: series.forKids,
    episodeNumber: current.number,
    episodeCount: episodes.length,
    // For the place marker: marks in earlier episodes are behind the reader
    episodes: episodes.map(({ slug, number }) => ({ slug, number })),
    kicker: (
      <Link
        href={routes.public.series(series.slug)}
        className="mb-4 inline-flex items-baseline gap-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
      >
        <span className="tnum font-mono text-xs uppercase tracking-[0.14em] text-accent-ink dark:text-accent">
          Episode {current.number}
        </span>
        <span aria-hidden="true" className="text-foreground/30">
          /
        </span>
        <span className="underline-offset-4 hover:underline">{series.title}</span>
      </Link>
    ),
    navigator: (
      <SeriesNavigator series={info} episodes={episodes} currentSlug={post.slug} preview={preview} />
    ),
    pager: <EpisodePager series={info} episodes={episodes} currentSlug={post.slug} preview={preview} />,
  };
}
