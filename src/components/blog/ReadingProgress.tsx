"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useLayoutEffect, useRef } from "react";

// Thin accent bar across the top that fills as you read. Tracks the article
// element (not the whole page) so the footer and related posts don't count.
export default function ReadingProgress({ targetId }: { targetId: string }) {
  const reduce = useReducedMotion();
  const target = useRef<HTMLElement | null>(null);

  // Must resolve before useScroll's own layout effect reads the target
  useLayoutEffect(() => {
    target.current = document.getElementById(targetId);
  }, [targetId]);

  const { scrollYProgress } = useScroll({
    target,
    offset: ["start 80px", "end end"],
  });
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[101] h-[3px] origin-left bg-accent"
      style={{ scaleX: reduce ? scrollYProgress : scaleX }}
    />
  );
}
