"use client";

import Link from "next/link";
import { useState, type PointerEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import routes from "@/lib/routes";
import { trackEvent } from "@/lib/mixpanel";
import { RESUME_FILENAME, RESUME_PATH } from "@/lib/site";
import { RollingLabel } from "@/components/motion/PillLink";
import SplitText from "@/components/motion/SplitText";
import { AvailabilityBadge } from "@/components/general/Availability";
import type { ContactInfo } from "@/lib/availability";

type DoorId = "hire" | "build";

// Recursive axis settings for the door words (same axes listed in each, so
// the browser can interpolate between them)
const REST_AXES = '"CASL" 0.6, "MONO" 0, "slnt" -6, "CRSV" 1';
const OPEN_AXES: Record<DoorId, string> = {
  hire: '"CASL" 0, "MONO" 1, "slnt" 0, "CRSV" 0',
  build: '"CASL" 1, "MONO" 0, "slnt" -15, "CRSV" 1',
};
const EASE = [0.16, 1, 0.3, 1] as const;

// Pill used inside a door. On the flooded (accent) door the solid one turns
// into ink-on-accent so it never disappears into the fill.
const DoorAction = ({
  href,
  children,
  icon,
  solid,
  flooded,
  download,
  onClick,
}: {
  href: string;
  children: ReactNode;
  icon: ReactNode;
  solid?: boolean;
  flooded: boolean;
  download?: string;
  onClick?: () => void;
}) => {
  const className = cn(
    "group group/btn relative inline-flex h-12 items-center gap-3 whitespace-nowrap rounded-full pl-6 pr-2 text-[0.95rem] font-medium transition-colors duration-500 ease-expo active:scale-[0.97]",
    solid
      ? flooded
        ? "bg-accent-on text-accent"
        : "bg-accent text-accent-on"
      : flooded
        ? "border border-accent-on/30 text-accent-on hover:border-accent-on"
        : "border border-foreground/20 text-foreground hover:border-foreground/60",
  );
  const disc = cn(
    "grid size-8 place-items-center rounded-full transition-[transform,background-color,color] duration-500 ease-expo group-hover/btn:rotate-[-45deg] [&_svg]:size-4",
    solid
      ? flooded
        ? "bg-accent text-accent-on"
        : "bg-accent-on text-accent"
      : flooded
        ? "bg-accent-on text-accent"
        : "bg-foreground text-background",
  );
  const inner = (
    <>
      <RollingLabel>{children}</RollingLabel>
      <span className={disc}>{icon}</span>
    </>
  );
  if (download) {
    return (
      <a href={href} download={download} onClick={onClick} className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} onClick={onClick} className={className}>
      {inner}
    </Link>
  );
};

const Door = ({
  id,
  active,
  other,
  onEnter,
  label,
  title,
  body,
  children,
}: {
  id: DoorId;
  active: boolean;
  other: boolean;
  onEnter: (id: DoorId) => void;
  label: string;
  title: [string, string];
  body: string;
  children: (flooded: boolean) => ReactNode;
}) => {
  const reduce = useReducedMotion();
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  const enter = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin({ x: e.clientX - r.left, y: e.clientY - r.top });
    onEnter(id);
  };

  return (
    <motion.div
      onPointerEnter={enter}
      onFocus={() => onEnter(id)}
      initial={false}
      animate={{ flexGrow: active ? 1.65 : other ? 0.85 : 1 }}
      transition={reduce ? { duration: 0 } : { duration: 0.9, ease: EASE }}
      className={cn(
        "relative flex min-h-[30rem] basis-0 flex-col justify-between overflow-hidden rounded-[1.25rem] border border-foreground/[0.08] bg-surface p-6 transition-colors duration-500 md:min-h-0 md:p-10",
        active ? "text-accent-on" : "text-foreground",
      )}
    >
      {/* Accent floods in from wherever the pointer came through the door */}
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{ scale: active ? 1 : 0, opacity: active ? 1 : 0 }}
        transition={
          reduce
            ? { duration: 0 }
            : { scale: { duration: 0.9, ease: EASE }, opacity: { duration: 0.3 } }
        }
        // Centring lives in the motion style: a transform class would be
        // overwritten by the scale animation
        style={{ left: origin.x || "50%", top: origin.y || "50%", x: "-50%", y: "-50%" }}
        className="pointer-events-none absolute size-[260vmax] rounded-full bg-accent"
      />

      <div className="relative flex items-center justify-between gap-4">
        <span className={cn("text-sm font-medium transition-colors duration-500", active ? "text-accent-on/75" : "text-foreground/60")}>
          {label}
        </span>
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ rotate: active ? 45 : 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className={cn(
            "grid size-12 place-items-center rounded-full border transition-colors duration-500",
            active ? "border-accent-on/30" : "border-foreground/15",
          )}
        >
          <ArrowUpRight className="size-5" />
        </motion.span>
      </div>

      <div className="relative flex flex-col gap-8">
        {/* The word changes hand as its door opens: the hiring door
            straightens into code, the building door loosens into brush */}
        <h3
          className="font-display text-[clamp(3rem,12vw,4.5rem)] font-extrabold leading-[0.92] tracking-[-0.035em] transition-[font-variation-settings] duration-700 ease-expo md:text-[5vw] 2xl:text-[4.75rem]"
          style={{ fontVariationSettings: active ? OPEN_AXES[id] : REST_AXES }}
        >
          {title[0]}
          <br />
          {title[1]}
        </h3>

        <div
          className={cn(
            "flex flex-col gap-6 transition-[opacity,transform] duration-700 ease-expo",
            // Always readable on touch and keyboard; slides in on desktop hover
            "md:translate-y-4 md:opacity-0 md:group-focus-within/doors:translate-y-0 md:group-focus-within/doors:opacity-100",
            active && "md:translate-y-0 md:opacity-100",
          )}
        >
          <p className={cn("max-w-[40ch] text-base leading-relaxed transition-colors duration-500 md:text-lg", active ? "text-accent-on/80" : "text-foreground/70")}>
            {body}
          </p>
          {children(active)}
        </div>
      </div>
    </motion.div>
  );
};

// Two kinds of visitor, two doors. Hovering one opens it wider, floods it
// with the accent from where the pointer came in, and widens its word.
const TwoDoors = ({ contact }: { contact: ContactInfo }) => {
  const [active, setActive] = useState<DoorId | null>(null);

  return (
    <section
      aria-label="Hiring or building something"
      className="mx-auto max-w-[1400px] px-4 py-24 md:px-8 md:py-36"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SplitText
          as="h2"
          text="Which one are you?"
          className="font-display text-[clamp(2.75rem,6.2vw,6rem)] font-semibold leading-[0.92] tracking-[-0.04em]"
        />
        <p className="max-w-[32ch] text-lg leading-relaxed text-foreground/65 md:pb-3">
          Pick a door. Either way, it ends with something good getting built.
        </p>
      </div>

      <div
        className="group/doors mt-12 flex flex-col gap-3 md:mt-16 md:h-[min(72dvh,42rem)] md:flex-row"
        onPointerLeave={() => setActive(null)}
      >
        <Door
          id="hire"
          active={active === "hire"}
          other={active === "build"}
          onEnter={setActive}
          label="For hiring teams"
          title={["Hiring?", "Let's talk."]}
          body="Web and mobile developer working in React, Next.js and React Native. The resume is the short version; the work is the proof."
        >
          {(flooded) => (
            <div className="flex flex-wrap gap-3">
              <DoorAction
                href={RESUME_PATH}
                download={RESUME_FILENAME}
                icon={<Download />}
                solid
                flooded={flooded}
                onClick={() => trackEvent("Resume Downloaded", { source_page: "home_doors" })}
              >
                Download resume
              </DoorAction>
              <DoorAction
                href={routes.public.portfolio}
                icon={<ArrowUpRight />}
                flooded={flooded}
                onClick={() => trackEvent("Home CTA Clicked", { cta: "doors_work" })}
              >
                See the work
              </DoorAction>
            </div>
          )}
        </Door>

        <Door
          id="build"
          active={active === "build"}
          other={active === "hire"}
          onEnter={setActive}
          label="For founders and teams"
          title={["Building", "something?"]}
          body="A site, an app or both. Tell me what you're making and I'll get back to you with how I'd build it."
        >
          {(flooded) => (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap gap-3">
                <DoorAction
                  href={`${routes.public.portfolio}#contact`}
                  icon={<ArrowUpRight />}
                  solid
                  flooded={flooded}
                  onClick={() => trackEvent("Home CTA Clicked", { cta: "doors_project" })}
                >
                  Start a project
                </DoorAction>
              </div>
              {contact.availability && (
                <AvailabilityBadge info={contact} surface={flooded ? "accent" : "page"} />
              )}
            </div>
          )}
        </Door>
      </div>
    </section>
  );
};

export default TwoDoors;
