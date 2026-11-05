"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Edge fade width (px). Snapped pills rest this far in, so they're never faded.
const FADE = 28;

export type CategoryPill = {
  key: string;
  label: string;
  href: string;
  count: number;
  color?: string;
  active: boolean;
};

// Category filter. Mobile: separate pills in one snap-scrolling row with edge
// fades that only appear where more pills exist; tapping a partly hidden pill
// scrolls it fully into view. md+: one capsule. An accent pill slides to the
// active category. Hrefs are built on the server.
export default function CategoryPills({ items }: { items: CategoryPill[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  // Which sides have hidden pills (drives the fades); only re-renders on change
  const measure = () => {
    const el = scroller.current;
    if (!el) return;
    const start = el.scrollLeft > 1;
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  };

  // Scroll so `pill` is fully visible and clear of the fades. Only real snap
  // positions are used, so mandatory snapping can't drag it back under a fade.
  // Does nothing if the pill is already fully visible.
  const reveal = (pill: HTMLElement | null, smooth = true) => {
    const el = scroller.current;
    if (!el || !pill) return;
    const box = el.getBoundingClientRect();
    const offsetOf = (node: Element) => node.getBoundingClientRect().left - box.left + el.scrollLeft;
    const start = offsetOf(pill);
    const end = start + pill.getBoundingClientRect().width;
    const view = el.clientWidth;
    const max = el.scrollWidth - view;
    const clamp = (v: number) => Math.min(max, Math.max(0, v));

    // A fade only exists on a side where there's more to scroll
    const fits = (p: number) =>
      start >= p + (p > 1 ? FADE : 0) - 1 && end <= p + view - (p < max - 1 ? FADE : 0) + 1;
    if (fits(el.scrollLeft)) return;

    // Snap positions: each pill resting FADE px in (matches scroll-padding), plus both ends
    const snaps = [0, max, ...Array.from(el.querySelectorAll("li"), (li) => clamp(offsetOf(li) - FADE))];
    const target =
      snaps.filter(fits).sort((a, b) => Math.abs(a - el.scrollLeft) - Math.abs(b - el.scrollLeft))[0] ??
      clamp(start - FADE);
    el.scrollTo({ left: target, behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    // Arriving on a filtered URL: bring the active pill into view if it's hidden
    reveal(el.querySelector<HTMLElement>('[aria-current="page"]'), false);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const fade = `linear-gradient(to right, transparent, #000 ${FADE}px, #000 calc(100% - ${FADE}px), transparent)`;
  const fadeStart = `linear-gradient(to right, transparent, #000 ${FADE}px)`;
  const fadeEnd = `linear-gradient(to right, #000 calc(100% - ${FADE}px), transparent)`;
  const mask = edges.start && edges.end ? fade : edges.start ? fadeStart : edges.end ? fadeEnd : undefined;

  return (
    <nav aria-label="Filter by category" className="relative -mx-4 md:mx-0">
      <div
        ref={scroller}
        onScroll={measure}
        style={{
          maskImage: mask,
          WebkitMaskImage: mask,
          // Inline (not a utility class) so snap resting points always clear the fades
          scrollPaddingLeft: FADE,
          scrollPaddingRight: FADE,
        }}
        className="snap-x snap-mandatory overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] md:snap-none md:px-0 [&::-webkit-scrollbar]:hidden"
      >
        <ul className="flex w-max gap-2 py-1 md:gap-1 md:rounded-full md:border md:border-foreground/10 md:bg-foreground/[0.03] md:p-1">
          {items.map((item) => (
            <li key={item.key} className="snap-start">
              <Link
                href={item.href}
                scroll={false}
                onClick={(e) => reveal(e.currentTarget)}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "relative flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-300 active:scale-[0.97] md:h-10 md:border-transparent",
                  item.active
                    ? "border-transparent text-accent-on"
                    : "border-foreground/15 bg-foreground/[0.03] text-foreground/70 hover:text-foreground md:bg-transparent",
                )}
              >
                {item.active && (
                  <motion.span
                    layoutId="blog-category-pill"
                    className="absolute inset-0 rounded-full bg-accent"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
                {item.color && (
                  <span
                    className="relative size-2 rounded-full ring-2 ring-background/60"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                )}
                <span className="relative whitespace-nowrap">{item.label}</span>
                <span
                  className={cn(
                    "relative grid min-w-5 place-items-center rounded-full px-1.5 font-mono text-[0.7rem] tabular-nums",
                    item.active ? "bg-accent-on/15" : "bg-foreground/10",
                  )}
                >
                  {item.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
