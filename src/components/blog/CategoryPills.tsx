"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type CategoryPill = {
  key: string;
  label: string;
  href: string;
  count: number;
  color?: string;
  active: boolean;
};

// Category filter strip: colour dot + post count, with an accent pill that
// slides to the active category. Hrefs are built on the server.
export default function CategoryPills({ items }: { items: CategoryPill[] }) {
  return (
    <nav aria-label="Filter by category" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
      <ul className="flex w-max gap-1 rounded-full border border-foreground/10 bg-foreground/[0.03] p-1">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              scroll={false}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "relative flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors duration-300",
                item.active ? "text-accent-on" : "text-foreground/65 hover:text-foreground",
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
    </nav>
  );
}
