"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useLenis } from "lenis/react";
import { navLinksData } from "@/data/navlinks";
import { cn } from "@/lib/utils";
import { useIntroReady } from "@/components/layout/Intro";

type NavItem = (typeof navLinksData)["links"][number];

const SPRING = { stiffness: 320, damping: 26, mass: 0.5 };

// Circular page-progress readout at the start of the dock
const ProgressRing = () => {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  const pct = useTransform(smooth, (v) => `${Math.round(v * 100)}`);

  return (
    <div className="relative grid size-11 shrink-0 place-items-center" aria-hidden="true">
      <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
        <circle cx="22" cy="22" r="19" className="fill-none stroke-foreground/10" strokeWidth="2.5" />
        <motion.circle
          cx="22"
          cy="22"
          r="19"
          className="fill-none stroke-accent"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ pathLength: smooth }}
        />
      </svg>
      <motion.span className="font-mono text-[0.65rem] tabular-nums text-foreground/80">
        {pct}
      </motion.span>
    </div>
  );
};

const DockItem = ({
  item,
  active,
  mouseX,
  onSelect,
  index,
}: {
  item: NavItem;
  active: boolean;
  mouseX: MotionValue<number>;
  onSelect: () => void;
  index: number;
}) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(false);

  // Mac-dock magnification: icon grows with pointer proximity
  const distance = useTransform(mouseX, (x) => {
    const r = ref.current?.getBoundingClientRect();
    return r ? x - (r.left + r.width / 2) : 999;
  });
  const size = useSpring(
    useTransform(distance, [-110, 0, 110], [40, reduce ? 40 : 54, 40]),
    SPRING,
  );
  const iconScale = useTransform(size, [40, 54], [1, 1.25]);

  return (
    <motion.li
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.8 + index * 0.07 }}
      className="relative"
    >
      {/* Tooltip for inactive items */}
      <AnimatePresence>
        {hover && !active && (
          <motion.span
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute -top-11 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-3 py-1 text-xs font-medium capitalize text-background md:block"
          >
            {item.title}
          </motion.span>
        )}
      </AnimatePresence>

      <a
        ref={ref}
        href={item.to}
        onClick={(e) => {
          e.preventDefault();
          onSelect();
        }}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        aria-current={active ? "true" : undefined}
        aria-label={item.title}
        className={cn(
          "relative flex items-center rounded-full outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-accent",
          active ? "text-accent-on" : "text-foreground/70 hover:text-foreground",
        )}
      >
        {active && (
          <motion.span
            layoutId="dock-pill"
            className="absolute inset-0 overflow-hidden rounded-full bg-accent shadow-[0_8px_24px_-8px_var(--clr)]"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            {/* Shine that sweeps across on every change of section */}
            <motion.span
              key={item.to}
              initial={{ x: "-120%" }}
              animate={{ x: "220%" }}
              transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1], delay: 0.15 }}
              className="absolute inset-y-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            />
          </motion.span>
        )}

        <motion.span
          style={{ width: size, height: size }}
          className="relative grid shrink-0 place-items-center"
        >
          <motion.span style={{ scale: iconScale }} className="grid place-items-center">
            <item.icon className="size-[1.05rem]" aria-hidden="true" />
          </motion.span>
        </motion.span>

        <AnimatePresence initial={false}>
          {active && (
            <motion.span
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="relative overflow-hidden whitespace-nowrap"
            >
              <span className="block pr-4 text-sm font-semibold capitalize">
                {item.title}
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </a>
    </motion.li>
  );
};

// Floating section dock for the portfolio page
const FloatNav = ({ data = navLinksData }: { data?: typeof navLinksData }) => {
  const [active, setActive] = useState(data.links[0]?.to ?? "");
  const lenis = useLenis();
  const mouseX = useMotionValue(Infinity);
  const ready = useIntroReady();

  // HDR: ACTIVE LINK FROM THE SECTION CROSSING THE VIEWPORT MIDDLE
  useEffect(() => {
    const sections = data.links
      .map((l) => document.querySelector<HTMLElement>(l.to))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [data.links]);

  //   HDR: Scroll to section on click
  const scrollToSection = (target: string) => {
    setActive(target);
    if (lenis) lenis.scrollTo(target, { offset: -80, duration: 1.4 });
    else document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 md:bottom-6">
      <motion.nav
        aria-label="Page sections"
        initial={{ y: 120, opacity: 0, scale: 0.9 }}
        animate={ready ? { y: 0, opacity: 1, scale: 1 } : undefined}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
        onPointerMove={(e) => e.pointerType === "mouse" && mouseX.set(e.clientX)}
        onPointerLeave={() => mouseX.set(Infinity)}
        className="flex items-end gap-1.5 rounded-full border border-foreground/10 bg-background/65 p-1.5 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.08),0_24px_60px_-20px_hsl(var(--foreground)/0.35)] backdrop-blur-2xl"
      >
        <ProgressRing />
        <span className="mx-1 h-6 w-px self-center bg-foreground/10" aria-hidden="true" />
        <ul className="flex items-end gap-1">
          {data.links.map((item, i) => (
            <DockItem
              key={item.title}
              item={item}
              index={i}
              active={active === item.to}
              mouseX={mouseX}
              onSelect={() => scrollToSection(item.to)}
            />
          ))}
        </ul>
      </motion.nav>
    </div>
  );
};

export default React.memo(FloatNav);
