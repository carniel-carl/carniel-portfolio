"use client";
import { useTheme } from "next-themes";
import { useEffect, useState, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { id: "light", label: "Light", icon: Sun },
  { id: "system", label: "System", icon: Monitor },
  { id: "dark", label: "Dark", icon: Moon },
] as const;

type ThemeId = (typeof OPTIONS)[number]["id"];

const resolve = (t: ThemeId) =>
  t === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    : t;

// Three-way theme pill. Switching paints the new theme as a circle that grows
// from the click point (View Transitions API); instant where unsupported or
// under reduced motion.
const ThemeSwitch = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => setMounted(true), []);

  if (!mounted)
    return <div className="h-9 w-[6.5rem] rounded-full bg-foreground/[0.06]" aria-hidden="true" />;

  const current = (theme ?? "system") as ThemeId;

  const choose = (next: ThemeId, e: MouseEvent<HTMLButtonElement>) => {
    if (next === current) return;
    const root = document.documentElement;
    const willChange = resolve(next) !== (root.classList.contains("dark") ? "dark" : "light");

    // Browsers refuse view transitions in background tabs (InvalidStateError)
    if (!document.startViewTransition || reduce || !willChange || document.hidden) {
      setTheme(next);
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    // Tells globals.css not to split the header out of the circle reveal
    root.dataset.themeSwitching = "";

    const transition = document.startViewTransition(() => {
      // Apply the class synchronously so the snapshot captures the new theme
      root.classList.toggle("dark", resolve(next) === "dark");
      root.style.colorScheme = resolve(next);
      flushSync(() => setTheme(next));
    });

    transition.ready
      .then(() => {
      root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 750,
          easing: "cubic-bezier(0.76, 0, 0.24, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
      // An aborted transition rejects `ready`; the theme has still switched
      .catch(() => {});

    transition.finished.finally(() => {
      delete root.dataset.themeSwitching;
    });
  };

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="relative flex h-9 items-center gap-0.5 rounded-full border border-foreground/10 bg-foreground/[0.04] p-[3px] backdrop-blur-md"
    >
      {OPTIONS.map(({ id, label, icon: Icon }) => {
        const active = current === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            onClick={(e) => choose(id, e)}
            className={cn(
              "group relative grid size-[1.875rem] place-items-center rounded-full outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-accent",
              active ? "text-accent-on" : "text-foreground/55 hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="theme-knob"
                className="absolute inset-0 rounded-full bg-accent shadow-[0_4px_14px_-4px_var(--clr)]"
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
              />
            )}
            <motion.span
              key={`${id}-${active}`}
              initial={active && !reduce ? { rotate: -90, scale: 0.4 } : false}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="relative grid place-items-center transition-transform duration-300 group-hover:scale-110 group-active:scale-90"
            >
              <Icon className="size-[0.95rem]" strokeWidth={2} />
            </motion.span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSwitch;
