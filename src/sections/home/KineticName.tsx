"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const rise: Variants = {
  hidden: { y: "105%" },
  visible: (i: number) => ({
    y: "0%",
    transition: { duration: 1.2, ease: EASE, delay: 0.15 + i * 0.06 },
  }),
};

// One letter. Near the pointer it condenses along the variable font's width
// axis and flushes to the accent color. Influence is computed from the
// letter's REST center (cached before any morph), so a letter changing width
// can never feed back into its own hover state: no flicker between letters.
const Letter = ({
  ch,
  index,
  pointerX,
  presence,
  centers,
  state,
  reduce,
}: {
  ch: string;
  index: number;
  pointerX: MotionValue<number>;
  presence: MotionValue<number>;
  centers: React.RefObject<{ x: number; w: number }[]>;
  state: "hidden" | "visible";
  reduce: boolean;
}) => {
  const influence = useTransform([pointerX, presence], ([x, p]: number[]) => {
    const c = centers.current?.[index];
    if (!c || p === 0) return 0;
    const d = (x - c.x) / (c.w * 1.25);
    return p * Math.exp(-d * d);
  });
  const smooth = useSpring(influence, { stiffness: 170, damping: 24, mass: 0.6 });

  const wdth = useTransform(smooth, [0, 1], [100, 75]);
  const wght = useTransform(smooth, [0, 1], [700, 800]);
  const mix = useTransform(smooth, [0, 1], [0, 100]);
  const fontVariationSettings = useMotionTemplate`"wdth" ${wdth}, "wght" ${wght}`;
  const color = useMotionTemplate`color-mix(in srgb, var(--clr) ${mix}%, hsl(var(--foreground)))`;

  return (
    <motion.span
      aria-hidden="true"
      data-letter
      custom={index}
      variants={rise}
      initial={reduce ? false : "hidden"}
      animate={state}
      className="inline-block"
      style={reduce ? undefined : { fontVariationSettings, color }}
    >
      {ch}
    </motion.span>
  );
};

const KineticName = ({
  name,
  state,
  style,
  className,
}: {
  name: string;
  state: "hidden" | "visible";
  style?: { y: MotionValue<string> };
  className?: string;
}) => {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLHeadingElement>(null);
  const centers = useRef<{ x: number; w: number }[]>([]);
  const pointerX = useMotionValue(-9999);
  const presence = useSpring(0, { stiffness: 120, damping: 20 });

  // Snapshot letter positions while the word is at rest
  const measure = () => {
    if (!ref.current || presence.get() > 0.02) return;
    centers.current = Array.from(
      ref.current.querySelectorAll<HTMLElement>("[data-letter]"),
    ).map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, w: r.width };
    });
  };

  useEffect(() => {
    const onResize = () => {
      centers.current = [];
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onEnter = (e: PointerEvent<HTMLHeadingElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    measure();
  };

  const onMove = (e: PointerEvent<HTMLHeadingElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    if (centers.current.length === 0) measure();
    pointerX.set(e.clientX);
    presence.set(1);
  };

  return (
    <motion.h1
      ref={ref}
      aria-label={name}
      style={reduce ? undefined : style}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={() => presence.set(0)}
      className={cn("flex overflow-hidden", className)}
    >
      {name.split("").map((ch, i) => (
        <Letter
          key={ch + i}
          ch={ch}
          index={i}
          pointerX={pointerX}
          presence={presence}
          centers={centers}
          state={state}
          reduce={reduce}
        />
      ))}
    </motion.h1>
  );
};

export default KineticName;
