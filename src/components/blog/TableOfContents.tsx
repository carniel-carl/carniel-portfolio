"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLenis } from "lenis/react";
import { ChevronDown, List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TocItem } from "@/lib/blog/article";

// "On this page" navigation. `rail` renders the sticky desktop column with a
// sliding marker on the section being read; otherwise a collapsible card.
export default function TableOfContents({
  items,
  variant,
}: {
  items: TocItem[];
  variant: "rail" | "inline";
}) {
  const [active, setActive] = useState(items[0]?.id);
  const lenis = useLenis();

  useEffect(() => {
    const els = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => Boolean(el));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-90px 0px -65% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  const go = (id: string) => {
    history.replaceState(null, "", `#${id}`);
    if (lenis) lenis.scrollTo(`#${id}`, { offset: -96, duration: 1.1 });
    else document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const list = (
    <ol className="flex flex-col gap-0.5">
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <li key={item.id} className={cn(item.level === 3 && "pl-3.5")}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                go(item.id);
              }}
              aria-current={isActive ? "location" : undefined}
              className={cn(
                "relative block rounded-md py-1.5 pl-3.5 pr-2 text-sm leading-snug transition-colors duration-300",
                isActive ? "text-foreground" : "text-foreground/55 hover:text-foreground",
              )}
            >
              {isActive && variant === "rail" && (
                <motion.span
                  layoutId="toc-marker"
                  className="absolute inset-y-1.5 left-0 w-[2px] rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              {item.text}
            </a>
          </li>
        );
      })}
    </ol>
  );

  if (variant === "rail") {
    return (
      <nav aria-label="On this page" className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/50">
          On this page
        </p>
        <div className="border-l border-foreground/10">{list}</div>
      </nav>
    );
  }

  return (
    <details className="group mb-10 rounded-[1.25rem] border border-foreground/10 bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <List className="size-4 text-accent-ink dark:text-accent" aria-hidden="true" />
          On this page
          <span className="font-normal text-foreground/55">{items.length} sections</span>
        </span>
        <ChevronDown
          className="size-4 text-foreground/50 transition-transform duration-300 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <nav aria-label="On this page" className="px-3 pb-4">
        {list}
      </nav>
    </details>
  );
}
