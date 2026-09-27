"use client";

import { useEffect, useState } from "react";

// Counts one view per browser per post per day, then shows the total.
// Rendered only on the public post page, never in the admin preview.
const DAY = 24 * 60 * 60 * 1000;

const format = (n: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export default function PostViews({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    const key = `viewed:${slug}`;
    let counted = false;
    try {
      counted = Date.now() - Number(localStorage.getItem(key) ?? 0) < DAY;
    } catch {
      // Storage blocked: count at most once per page load
    }
    // Automated browsers aren't readers
    const count = !counted && !navigator.webdriver;

    const controller = new AbortController();
    fetch(`/api/views/${encodeURIComponent(slug)}`, {
      method: count ? "POST" : "GET",
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { views?: number } | null) => {
        if (typeof data?.views !== "number") return;
        setViews(data.views);
        if (count) {
          try {
            localStorage.setItem(key, String(Date.now()));
          } catch {}
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [slug]);

  // Hidden until there's a real number worth showing
  if (!views) return null;
  return (
    <span className="tabular-nums">
      {format(views)} {views === 1 ? "view" : "views"}
    </span>
  );
}
