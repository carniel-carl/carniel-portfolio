"use client";

import { Children, useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Series cards on one row that scrolls sideways, like running a finger along
 * a bookshelf. Swipe or trackpad on touch and laptops; arrow buttons for a
 * mouse; the row itself takes arrow keys. Edges fade only on the side that
 * has more to see, and the next card always peeks in.
 */
export default function SeriesShelf({
  label,
  header,
  actions,
  children,
}: {
  label: string;
  header: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const id = useId();
  const row = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const sync = useCallback(() => {
    const el = row.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft > 4, end: el.scrollLeft < max - 4 });
  }, []);

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    el.addEventListener("scroll", sync, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", sync);
    };
  }, [sync]);

  // One card's width per press, so a card always lands on the snap line
  const step = (dir: 1 | -1) => {
    const el = row.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: reduce ? "auto" : "smooth" });
  };

  const scrollable = edges.start || edges.end;

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        {header}
        <div className="flex shrink-0 items-center gap-2">
          {scrollable && (
            <div className="hidden gap-2 md:flex">
              <ShelfButton label="Previous series" controls={id} disabled={!edges.start} onClick={() => step(-1)}>
                <ChevronLeft className="size-4" />
              </ShelfButton>
              <ShelfButton label="More series" controls={id} disabled={!edges.end} onClick={() => step(1)}>
                <ChevronRight className="size-4" />
              </ShelfButton>
            </div>
          )}
          {actions}
        </div>
      </div>

      <ul
        id={id}
        ref={row}
        role="list"
        aria-label={label}
        tabIndex={scrollable ? 0 : undefined}
        // Sideways gestures belong to the row, not to the page's smooth scroll
        data-lenis-prevent-horizontal
        className={cn(
          "shelf-row flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-5 outline-none md:gap-6",
          "rounded-[1.25rem] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background",
          edges.start && "shelf-fade-start",
          edges.end && "shelf-fade-end",
        )}
      >
        {Children.map(children, (child) => (
          <li className="flex w-[82%] shrink-0 snap-start sm:w-[21rem] lg:w-[calc((100%-3rem)/3.2)] [&>*]:w-full">
            {child}
          </li>
        ))}
      </ul>

      {/* The shelf the cards stand on */}
      <div aria-hidden="true" className="h-px bg-foreground/15 shadow-[0_6px_14px_rgb(0_0_0/0.18)]" />
    </div>
  );
}

function ShelfButton({
  label,
  controls,
  disabled,
  onClick,
  children,
}: {
  label: string;
  controls: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-controls={controls}
      disabled={disabled}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-full border border-foreground/15 transition-[border-color,opacity] hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-35"
    >
      {children}
    </button>
  );
}
