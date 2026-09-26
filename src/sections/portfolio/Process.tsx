"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Compass, PenTool, Code2, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    verb: "Discover",
    icon: Compass,
    body: "We start with your goals, your users and your constraints, so the build solves the right problem.",
    points: ["Goals and audience", "Scope and timeline", "Web, mobile or both"],
  },
  {
    verb: "Design",
    icon: PenTool,
    body: "Flows become interface and motion, reviewed early and often so there are no surprises later.",
    points: ["User flows", "UI and interaction", "Clickable prototypes"],
  },
  {
    verb: "Build",
    icon: Code2,
    body: "Typed, tested React and React Native code, shipped in small steps you can click through.",
    points: ["Next.js on the web", "React Native on mobile", "Weekly previews"],
  },
  {
    verb: "Launch",
    icon: Rocket,
    body: "Deployment, analytics and performance checks, then steady iteration once real users arrive.",
    points: ["Web and app store release", "Analytics", "Ongoing support"],
  },
];

// Vertical scroll drives a horizontal pan: the section pins at the top of the
// viewport while the track slides one step at a time. Stacks below md.
const Process = () => {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  // Track is STEPS.length panels of 62vw plus the intro panel of 38vw
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    ["0vw", `-${STEPS.length * 62 + 38 - 100 + 4}vw`],
  );
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      ref={ref}
      aria-label="How I work"
      className="relative -mx-4 pb-24 md:-mx-8 md:h-[400vh] md:pb-0"
    >
      <div className="md:sticky md:top-0 md:flex md:h-[100dvh] md:flex-col md:justify-center md:overflow-hidden">
        <motion.div
          style={reduce ? undefined : { x }}
          className="flex flex-col gap-4 px-4 md:w-max md:flex-row md:items-stretch md:gap-0 md:px-8 max-md:!transform-none"
        >
          <div className="flex flex-col justify-end pb-6 md:w-[38vw] md:pb-0 md:pr-12">
            <h2 className="font-display text-[clamp(3.25rem,10vw,9rem)] font-semibold leading-[0.88] tracking-[-0.045em] [font-stretch:75%]">
              How I work
            </h2>
            <p className="mt-6 max-w-[34ch] text-lg text-foreground/70">
              The same four moves for every project, whether it lands in a
              browser or an app store.
            </p>
          </div>

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const accent = i === 2;
            return (
              <article
                key={step.verb}
                className="md:w-[62vw] md:pr-5"
              >
                <div
                  className={cn(
                    "flex h-full min-h-[24rem] flex-col justify-between gap-10 rounded-[1.25rem] p-6 md:min-h-[62dvh] md:p-10",
                    accent
                      ? "bg-accent text-accent-on"
                      : "border border-foreground/[0.08] bg-surface",
                  )}
                >
                  <div className="flex items-start justify-between gap-6">
                    <h3 className="font-display text-[clamp(3rem,8vw,7.5rem)] font-semibold leading-[0.9] tracking-[-0.04em]">
                      {step.verb}
                    </h3>
                    <span
                      className={cn(
                        "grid size-14 shrink-0 place-items-center rounded-full md:size-16",
                        accent ? "bg-accent-on text-accent" : "bg-foreground text-background",
                      )}
                    >
                      <Icon className="size-6" />
                    </span>
                  </div>
                  <div className="grid gap-8 md:grid-cols-2 md:items-end">
                    <p
                      className={cn(
                        "max-w-[38ch] text-lg leading-relaxed md:text-xl",
                        accent ? "text-accent-on/85" : "text-foreground/75",
                      )}
                    >
                      {step.body}
                    </p>
                    <ul className="flex flex-wrap gap-2 md:justify-end">
                      {step.points.map((p) => (
                        <li
                          key={p}
                          className={cn(
                            "rounded-full border px-3 py-1 text-sm",
                            accent ? "border-accent-on/25" : "border-foreground/15",
                          )}
                        >
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            );
          })}
        </motion.div>

        {/* Pan progress */}
        <div className="mx-8 mt-10 hidden h-px bg-foreground/10 md:block">
          <motion.div
            style={{ scaleX: bar }}
            className="h-full origin-left bg-accent"
          />
        </div>
      </div>
    </section>
  );
};

export default Process;
