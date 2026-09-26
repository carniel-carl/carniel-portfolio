"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

type Stat = { value: number; label: string; note: string };

const CountUp = ({ value }: { value: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => String(Math.round(v)).padStart(2, "0"));

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      mv.set(value);
      return;
    }
    const c = animate(mv, value, { duration: 1.8, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [inView, reduce, value, mv]);

  return <motion.span ref={ref}>{text}</motion.span>;
};

// Real numbers only: counted from the database at request time
const Highlights = ({
  projects,
  skills,
  articles,
}: {
  projects: number;
  skills: number;
  articles: number;
}) => {
  const stats: Stat[] = [
    { value: projects, label: "Projects shipped", note: "Web and mobile" },
    { value: 3, label: "Platforms", note: "Web, iOS and Android" },
    { value: skills, label: "Tools in the kit", note: "And counting" },
    { value: articles, label: "Articles written", note: "On the blog" },
  ].filter((s) => s.value > 0);

  return (
    <section
      aria-label="At a glance"
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-12 border-y border-foreground/10 py-12 md:py-16",
        stats.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3",
      )}
    >
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col gap-3">
          <span className="font-mono text-6xl font-medium tabular-nums tracking-tight md:text-8xl">
            <CountUp value={s.value} />
          </span>
          <span className="flex flex-col">
            <span className="font-medium">{s.label}</span>
            <span className="text-sm text-foreground/60">{s.note}</span>
          </span>
        </div>
      ))}
    </section>
  );
};

export default Highlights;
