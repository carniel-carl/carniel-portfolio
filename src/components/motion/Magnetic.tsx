"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { ReactNode, useRef, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

// Pulls its child toward the pointer. Motion values only, no React state, so
// pointer movement never re-renders the tree. Inert on touch + reduced motion.
const Magnetic = ({
  children,
  strength = 0.35,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 180, damping: 16, mass: 0.4 });
  const y = useSpring(useMotionValue(0), { stiffness: 180, damping: 16, mass: 0.4 });

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ x, y }}
      className={cn("inline-block", className)}
    >
      {children}
    </motion.div>
  );
};

export default Magnetic;
