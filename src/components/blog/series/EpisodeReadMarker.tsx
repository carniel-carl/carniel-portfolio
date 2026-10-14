"use client";

import { useEffect, useRef } from "react";
import { markEpisodeRead } from "@/lib/blog/series-progress";

// Invisible line at the end of an episode: scrolling past it marks the
// episode finished in this reader's series progress.
export default function EpisodeReadMarker({
  seriesSlug,
  postSlug,
}: {
  seriesSlug: string;
  postSlug: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        markEpisodeRead(seriesSlug, postSlug);
        observer.disconnect();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [seriesSlug, postSlug]);

  return <div ref={ref} aria-hidden="true" className="h-px" />;
}
