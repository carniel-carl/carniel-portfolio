"use client";

import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";

type Option<T extends string> = { value: T; label: string; count?: number };

type SegmentedTabsProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  className?: string;
};

/** Pill toggle for 2 to 4 views of the same list. */
export default function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
  className,
}: SegmentedTabsProps<T>) {
  const id = useId();
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="tablist"
      className={cn("inline-flex w-fit items-center gap-0.5 rounded-full bg-muted p-1", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative isolate inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={`${id}-pill`}
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }}
                className="absolute inset-0 -z-10 rounded-full bg-card shadow-sm ring-1 ring-border"
              />
            )}
            {option.label}
            {option.count !== undefined && (
              <span className="tnum text-xs text-muted-foreground">{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
