"use client";

import { Check } from "lucide-react";
import { useSeriesProgress } from "@/lib/blog/series-progress";

// "3 of 8 read" on a series card, once this reader has started it
export default function SeriesProgressChip({
  seriesSlug,
  episodeSlugs,
}: {
  seriesSlug: string;
  episodeSlugs: string[];
}) {
  const progress = useSeriesProgress(seriesSlug, episodeSlugs);
  if (!progress.ready || !progress.started) return null;

  return (
    <span className="tnum inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-on">
      {progress.finished && <Check className="size-3" aria-hidden="true" />}
      {progress.finished ? "Finished" : `${progress.readCount} of ${episodeSlugs.length} read`}
    </span>
  );
}
