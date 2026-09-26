"use client";

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { useRef } from "react";
import SVGIcon from "@/components/general/SVGIcon";
import { cn } from "@/lib/utils";

const wrap = (min: number, max: number, v: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

// Drifts on its own; scroll velocity speeds it up, flips its direction and
// skews the type so the page reacts physically to how fast you scroll.
const Row = ({
  text,
  baseVelocity,
  muted,
}: {
  text: string;
  baseVelocity: number;
  muted?: boolean;
}) => {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 });
  const factor = useTransform(smooth, [0, 1000], [0, 4], { clamp: false });
  const skewX = useTransform(smooth, [-2500, 2500], [7, -7]);
  const x = useTransform(baseX, (v) => `${wrap(-25, -50, v)}%`);
  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let move = direction.current * baseVelocity * (delta / 1000);
    const f = factor.get();
    if (f < 0) direction.current = -1;
    else if (f > 0) direction.current = 1;
    move += direction.current * move * f;
    baseX.set(baseX.get() + move);
  });

  return (
    <div className="flex overflow-hidden whitespace-nowrap">
      <motion.div
        style={{ x, skewX: reduce ? 0 : skewX }}
        className="flex shrink-0 items-center whitespace-nowrap"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="flex items-center" aria-hidden={i > 0}>
            <span
              className={cn(
                "px-[3vw] font-display text-[18vw] font-bold leading-[0.95] tracking-[-0.04em] [font-stretch:75%] md:text-[13vw]",
                muted ? "text-foreground" : "text-accent",
              )}
            >
              {text}
            </span>
            <span className="text-accent">
              <SVGIcon width="5vw" height="5vw" />
            </span>
          </span>
        ))}
      </motion.div>
    </div>
  );
};

const VelocityMarquee = () => {
  return (
    <section
      aria-label="Web and mobile developer"
      className="relative py-16 md:py-24"
    >
      <Row text="Web & Mobile" baseVelocity={-3} />
      <Row text="Developer" baseVelocity={3} muted />
    </section>
  );
};

export default VelocityMarquee;
