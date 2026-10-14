"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import LevelBadge from "@/components/blog/series/LevelBadge";
import { levelLabel } from "@/lib/blog/levels";
import { useSeriesProgress } from "@/lib/blog/series-progress";
import routes from "@/lib/routes";
import { cn } from "@/lib/utils";

export type ListEpisode = {
  slug: string;
  title: string;
  excerpt: string | null;
  level: string | null;
  number: number;
  readingMinutes: number;
};

// Consecutive episodes at the same level form a chapter. Order always wins:
// an episode never moves to sit with its level elsewhere in the series.
function chapters(episodes: ListEpisode[]) {
  const groups: { label: string | null; episodes: ListEpisode[] }[] = [];
  for (const ep of episodes) {
    const label = levelLabel(ep.level);
    const last = groups[groups.length - 1];
    if (last && (!label || label === last.label)) last.episodes.push(ep);
    else groups.push({ label, episodes: [ep] });
  }
  return groups;
}

export default function SeriesEpisodeList({
  seriesSlug,
  episodes,
}: {
  seriesSlug: string;
  episodes: ListEpisode[];
}) {
  const progress = useSeriesProgress(
    seriesSlug,
    episodes.map((e) => e.slug),
  );
  const groups = chapters(episodes);
  const labelled = groups.some((g) => g.label);

  return (
    <div className="flex flex-col gap-12">
      {groups.map((group, gi) => (
        <section key={gi} aria-labelledby={labelled && group.label ? `chapter-${gi}` : undefined}>
          {labelled && group.label && (
            <h2
              id={`chapter-${gi}`}
              className="mb-4 flex items-baseline gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/55"
            >
              <span className="text-accent-ink dark:text-accent">Part {gi + 1}</span>
              {group.label}
              <span className="font-normal normal-case tracking-normal text-foreground/45">
                {group.episodes.length} {group.episodes.length === 1 ? "episode" : "episodes"}
              </span>
            </h2>
          )}
          <ol start={group.episodes[0].number} className="border-t border-foreground/10">
            {group.episodes.map((ep) => {
              const done = progress.ready && progress.read.has(ep.slug);
              const isNext = progress.ready && progress.started && progress.resume === ep.slug;
              return (
                <li key={ep.slug} className="border-b border-foreground/10">
                  <Link
                    href={routes.public.blogPost(ep.slug)}
                    className="group grid grid-cols-[3rem_1fr] gap-x-4 gap-y-2 py-6 md:grid-cols-[4.5rem_1fr_auto] md:items-center"
                  >
                    <span
                      className={cn(
                        "row-span-2 font-display text-3xl font-semibold leading-none tracking-[-0.04em] md:row-span-1 md:text-4xl",
                        done ? "text-foreground/30" : "text-foreground",
                      )}
                    >
                      {String(ep.number).padStart(2, "0")}
                    </span>
                    <span className="flex min-w-0 flex-col gap-2">
                      <span className="text-balance font-display text-xl font-semibold leading-tight tracking-[-0.015em] transition-transform duration-500 ease-expo group-hover:translate-x-1.5 md:text-2xl">
                        {ep.title}
                      </span>
                      {ep.excerpt && (
                        <span className="line-clamp-2 text-foreground/65">{ep.excerpt}</span>
                      )}
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground/55">
                        <span className="tnum">{ep.readingMinutes} min read</span>
                        {!labelled && <LevelBadge level={ep.level} />}
                      </span>
                    </span>
                    <span className="col-start-2 flex items-center gap-2 text-sm md:col-start-auto">
                      {done ? (
                        <span className="inline-flex items-center gap-1.5 text-foreground/55">
                          <Check className="size-4 text-accent-ink dark:text-accent" aria-hidden="true" />
                          Read
                        </span>
                      ) : isNext ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 font-medium text-accent-on">
                          Up next
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </span>
                      ) : (
                        <ArrowRight
                          className="size-4 text-foreground/35 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-foreground"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
