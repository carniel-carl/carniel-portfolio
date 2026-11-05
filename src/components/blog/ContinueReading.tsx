"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import PlaceRibbon from "@/components/blog/PlaceRibbon";
import SeriesShelf from "@/components/blog/series/SeriesShelf";
import { trackEvent } from "@/lib/mixpanel";
import {
  clearMark,
  clip,
  listMarks,
  PLACE_PARAM,
  snippetBefore,
  timeAgo,
  type PlaceMark,
} from "@/lib/blog/place-marks";
import { hideFromShelf, progressFor, useAllSeriesProgress } from "@/lib/blog/series-progress";
import routes from "@/lib/routes";

type MarkedPost = {
  slug: string;
  title: string;
  readingMinutes: number;
  category: { name: string; color: string } | null;
};

export type ShelfSeries = { slug: string; title: string; episodeSlugs: string[] };

type InSeries = {
  slug: string;
  title: string;
  number: number;
  total: number;
  readCount: number;
  // Where series progress says to go next, which can differ from a mark
  // (e.g. re-reading episode 1 after finishing episode 6)
  resume: { slug: string; number: number } | null;
};

// A place mark (an exact spot), or the episode a started series continues with
type Item =
  | { kind: "mark"; slug: string; at: number; mark: PlaceMark; series?: InSeries }
  | { kind: "next"; slug: string; at: number; series: InSeries; unfinished: boolean };

/**
 * Where this reader left off, newest first: posts they marked their place in,
 * and series they started but haven't finished (one card per series, its
 * mark if it has one, else the episode it continues with). Marks and progress
 * live in this browser only, so the shelf renders nothing until it has read
 * them, and nothing at all without any.
 */
export default function ContinueReading({ series = [] }: { series?: ShelfSeries[] }) {
  const reduce = useReducedMotion();
  const { store, ready } = useAllSeriesProgress();
  const [marks, setMarks] = useState<ReturnType<typeof listMarks> | null>(null);
  const [posts, setPosts] = useState<Map<string, MarkedPost>>(new Map());

  useEffect(() => setMarks(listMarks()), []);

  const items = useMemo(() => {
    if (!marks || !ready) return [];
    const episodeOf = new Map(
      series.flatMap((s) => s.episodeSlugs.map((slug, i) => [slug, { s, number: i + 1 }] as const)),
    );
    const inSeries = (s: ShelfSeries, number: number): InSeries => {
      const p = progressFor(store[s.slug], s.episodeSlugs);
      const resume = p.resume ? { slug: p.resume, number: s.episodeSlugs.indexOf(p.resume) + 1 } : null;
      return { slug: s.slug, title: s.title, number, total: s.episodeSlugs.length, readCount: p.readCount, resume };
    };

    const list: Item[] = [];
    // Marks, newest first; in a series the newest one is where the reader is
    // (re-reading episode 1 after marking episode 7 means "I'm in episode 1
    // now"). Older marks stay saved and come back once the newer one clears.
    const placed = new Set<string>();
    for (const m of marks) {
      const ep = episodeOf.get(m.slug);
      if (!ep) {
        list.push({ kind: "mark", slug: m.slug, at: m.savedAt, mark: m });
        continue;
      }
      if (placed.has(ep.s.slug)) continue;
      placed.add(ep.s.slug);
      list.push({ kind: "mark", slug: m.slug, at: m.savedAt, mark: m, series: inSeries(ep.s, ep.number) });
    }
    // Started series without a mark: the episode they continue with
    for (const s of series) {
      const entry = store[s.slug];
      if (placed.has(s.slug) || !entry || entry.hidden) continue;
      const p = progressFor(entry, s.episodeSlugs);
      if (!p.started || p.finished || !p.resume) continue;
      list.push({
        kind: "next",
        slug: p.resume,
        at: entry.at ?? 0,
        series: inSeries(s, s.episodeSlugs.indexOf(p.resume) + 1),
        unfinished: entry.last === p.resume,
      });
    }
    return list.sort((a, b) => b.at - a.at);
  }, [marks, store, ready, series]);

  // One request for every post on the shelf; it also drops unpublished ones
  const slugKey = [...new Set(items.map((it) => it.slug))].sort().join(",");
  useEffect(() => {
    if (!slugKey) return;
    const controller = new AbortController();
    fetch(`/api/blog/marked?slugs=${encodeURIComponent(slugKey)}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { posts?: MarkedPost[] } | null) => {
        setPosts(new Map((data?.posts ?? []).map((p) => [p.slug, p])));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [slugKey]);

  const shown = items.flatMap((item) => {
    const post = posts.get(item.slug);
    return post ? [{ item, post }] : [];
  });
  if (!shown.length) return null;

  const remove = (item: Item) => {
    // A series card leaves the shelf until the reader opens an episode again
    if (item.series) hideFromShelf(item.series.slug);
    if (item.kind === "mark") {
      clearMark(item.slug);
      setMarks((list) => list?.filter((m) => m.slug !== item.slug) ?? null);
    }
    trackEvent("Blog Continue Reading Removed", { slug: item.slug, kind: item.kind });
  };

  return (
    <motion.section
      aria-labelledby="continue-reading"
      className="mb-14 md:mb-20"
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <SeriesShelf
        label="Posts and series you're partway through"
        noun="posts"
        header={
          <div className="flex items-center gap-3">
            <PlaceRibbon className="h-8 w-4 shrink-0" />
            <div className="flex flex-col gap-1">
              <h2
                id="continue-reading"
                className="font-display text-3xl font-semibold tracking-[-0.03em] md:text-4xl"
              >
                Continue reading
              </h2>
              <p className="text-foreground/65">Right back to where you stopped.</p>
            </div>
          </div>
        }
      >
        {shown.map(({ item, post }) => (
          <ShelfCard key={item.slug} item={item} post={post} onRemove={() => remove(item)} />
        ))}
      </SeriesShelf>
    </motion.section>
  );
}

function ShelfCard({ item, post, onRemove }: { item: Item; post: MarkedPost; onRemove: () => void }) {
  const { series } = item;
  const mark = item.kind === "mark" ? item.mark : null;

  // How far along: through the post for a mark, through the series otherwise
  const placeProgress = typeof mark?.progress === "number" ? Math.min(1, Math.max(0, mark.progress)) : null;
  const bar = mark ? placeProgress : series ? series.readCount / series.total : null;
  const left = placeProgress === null ? null : Math.max(1, Math.round(post.readingMinutes * (1 - placeProgress)));
  // A mark behind where the reader has got to in the series: offer both
  const ahead = mark && series?.resume && series.resume.number > series.number ? series.resume : null;

  return (
    <article className="group relative flex flex-col gap-3 rounded-[1.25rem] border border-foreground/10 bg-surface p-5 transition-colors hover:border-foreground/30 md:p-6">
      <div className="flex min-h-9 items-center justify-between gap-3">
        {series ? (
          <span className="min-w-0 truncate text-xs font-medium uppercase tracking-[0.12em] text-foreground/55">
            <span className="text-accent-ink dark:text-accent">{series.title}</span>
            <span className="tnum"> · Episode {series.number}</span>
          </span>
        ) : post.category ? (
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-foreground/55">
            <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: post.category.color }} />
            {post.category.name}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          aria-label={
            mark ? `Remove your place in ${post.title}` : `Hide ${series?.title ?? post.title} from Continue reading`
          }
          onClick={onRemove}
          className="relative z-10 -mr-2 grid size-9 shrink-0 place-items-center rounded-full text-foreground/45 transition-colors hover:bg-foreground/[0.07] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <X className="size-4" />
        </button>
      </div>

      <h3 className="text-balance font-display text-2xl font-semibold leading-[1.1] tracking-[-0.025em]">
        <Link
          href={mark ? `${routes.public.blogPost(post.slug)}?${PLACE_PARAM}` : routes.public.blogPost(post.slug)}
          onClick={() => trackEvent("Blog Continue Reading Clicked", { slug: post.slug, kind: item.kind })}
          className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-[1.25rem] focus-visible:after:ring-2 focus-visible:after:ring-ring"
        >
          {post.title}
        </Link>
      </h3>

      {mark ? (
        <p className="line-clamp-2 text-sm leading-relaxed text-foreground/65">
          {snippetBefore(mark)}
          <span className="place-stroke box-decoration-clone px-0.5 font-medium text-foreground">
            {clip(mark.quote, 60)}
          </span>
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-foreground/65">
          {item.kind === "next" && item.unfinished
            ? "You started this episode but didn’t finish it."
            : "Up next in the series."}
        </p>
      )}

      <div className="mt-auto flex flex-col gap-2.5 pt-2">
        {bar !== null && (
          <div aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-foreground/10">
            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(4, bar * 100)}%` }} />
          </div>
        )}
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground/60">
          {mark ? (
            <>
              {left !== null && (
                <>
                  <span className="tnum">{left} min left</span>
                  <span className="size-1 rounded-full bg-foreground/30" aria-hidden="true" />
                </>
              )}
              <span>Marked {timeAgo(mark.savedAt)}</span>
            </>
          ) : (
            series && (
              <>
                <span className="tnum">
                  {series.readCount} of {series.total} episodes read
                </span>
                <span className="size-1 rounded-full bg-foreground/30" aria-hidden="true" />
                <span className="tnum">{post.readingMinutes} min</span>
              </>
            )
          )}
        </p>
        {ahead && (
          <Link
            href={routes.public.blogPost(ahead.slug)}
            onClick={() => trackEvent("Blog Continue Reading Clicked", { slug: ahead.slug, kind: "next-unread" })}
            className="group/next relative z-10 inline-flex items-center gap-1.5 self-start rounded-full text-sm font-medium text-foreground/75 underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Next unread: Episode {ahead.number}
            <ArrowRight className="size-3.5 transition-transform duration-300 group-hover/next:translate-x-0.5" />
          </Link>
        )}
      </div>
    </article>
  );
}
