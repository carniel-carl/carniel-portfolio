"use client";

import { cn } from "@/lib/utils";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { createElement, useRef, type ElementType } from "react";
import { useIntroReady } from "@/components/layout/Intro";

type SplitTextProps = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  by?: "word" | "char";
  className?: string;
  unitClassName?: string;
  delay?: number;
  stagger?: number;
  // Controlled playback (e.g. hero waits for the preloader). When omitted the
  // text reveals once it scrolls into view.
  play?: boolean;
};

const EASE = [0.16, 1, 0.3, 1] as const;

const unitVariant: Variants = {
  hidden: { y: "115%" },
  visible: { y: "0%", transition: { duration: 1.1, ease: EASE } },
};

// Masked line-rise reveal. Each unit slides up out of an overflow mask; the
// mask carries bottom padding so descenders (g, j, p, q, y) are never clipped.
const SplitText = ({
  text,
  as = "span",
  by = "word",
  className,
  unitClassName,
  delay = 0,
  stagger,
  play,
}: SplitTextProps) => {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  const step = stagger ?? (by === "char" ? 0.035 : 0.08);

  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const introReady = useIntroReady();
  // Controlled by `play`, otherwise: in view AND not hidden under the intro
  const shouldPlay = play !== undefined ? play : inView && introReady;
  const animationProps = reduce
    ? { initial: false as const }
    : { initial: "hidden", animate: shouldPlay ? "visible" : "hidden" };

  const Tag = motion[as];

  let index = 0;
  const content = words.map((word, wi) => {
    const units = by === "char" ? word.split("") : [word];
    return (
      <span key={`${word}-${wi}`} className="inline-block whitespace-nowrap">
        {units.map((unit, ui) => {
          const i = index++;
          return (
            <span
              key={`${unit}-${ui}`}
              className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-top"
            >
              <motion.span
                className={cn("inline-block will-change-transform", unitClassName)}
                variants={unitVariant}
                transition={{ delay: delay + i * step }}
              >
                {unit}
              </motion.span>
            </span>
          );
        })}
        {wi < words.length - 1 && " "}
      </span>
    );
  });

  const props: Record<string, unknown> = {
    ref,
    className,
    "aria-label": text,
    ...animationProps,
  };

  return createElement(
    Tag as ElementType,
    props,
    <span aria-hidden="true">{content}</span>,
  );
};

export default SplitText;
