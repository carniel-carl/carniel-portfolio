"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  ViewTransition,
  type PointerEvent,
} from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  type Variants,
} from "framer-motion";
import { useLenis } from "lenis/react";
import { ArrowUpRight, Globe, Layers, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import routes from "@/lib/routes";
import { trackEvent } from "@/lib/mixpanel";
import { projectCoverName } from "@/lib/projects/view-transitions";
import ProjectLinks from "./ProjectLinks";
import { ProjectRole } from "./ProjectMeta";
import PillLink from "@/components/motion/PillLink";
import type { ProjectDataType } from "@/types/project";

// HDR: STAGES
// The journey is a list of screens the one device becomes. It opens as the
// portrait frame, becomes a browser for web work and a phone for apps (a
// "both" project gets one of each, browser first), and closes as a pill-shaped
// call to action.
type Form = "portrait" | "browser" | "phone" | "pill";
type Stage =
  | { form: "portrait" }
  | { form: "browser" | "phone"; project: ProjectDataType; index: number }
  | { form: "pill" };

const buildStages = (projects: ProjectDataType[]): Stage[] => [
  { form: "portrait" },
  ...projects.flatMap((project, index): Stage[] => {
    const p = project.platform ?? "web";
    if (p === "both") {
      return [
        { form: "browser", project, index },
        { form: "phone", project, index },
      ];
    }
    return [{ form: p === "mobile" ? "phone" : "browser", project, index }];
  }),
  { form: "pill" },
];

// Device size for a form, fitted to the space beside the copy
const shapeOf = (form: Form, vw: number, vh: number) => {
  const maxW = Math.min(vw * 0.5, 860);
  const maxH = Math.min(vh * 0.74, 700);
  switch (form) {
    case "portrait": {
      const h = maxH * 0.92;
      return { width: h * 0.8, height: h, radius: 24 };
    }
    case "browser": {
      const w = Math.min(maxW, (maxH - 40) / 0.62);
      return { width: w, height: w * 0.62 + 40, radius: 18 };
    }
    case "phone": {
      const h = maxH;
      return { width: h * 0.48, height: h, radius: 48 };
    }
    case "pill":
      return { width: Math.min(maxW * 0.78, 620), height: 180, radius: 999 };
  }
};

const PLATFORM = {
  browser: { label: "On the web", icon: Globe },
  phone: { label: "On mobile", icon: Smartphone },
} as const;

const hostOf = (url?: string) => {
  if (!url) return null;
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return null;
  }
};

const EASE = [0.16, 1, 0.3, 1] as const;
const CURTAIN = [0.76, 0, 0.24, 1] as const;

// HDR: SCREEN CONTENT
// Phone screen: the app's video when it has one, otherwise its screenshots
// crossfading. Mounted only while the phone is showing this project.
const PhoneScreen = ({ project }: { project: ProjectDataType }) => {
  const reduce = useReducedMotion();
  const shots = project.screenshots?.length ? project.screenshots : [project.posterUrl || project.img];
  const [shot, setShot] = useState(0);
  const playVideo = Boolean(project.videoUrl) && !reduce;

  useEffect(() => {
    if (playVideo || reduce || shots.length < 2) return;
    const t = setInterval(() => setShot((s) => (s + 1) % shots.length), 2400);
    return () => clearInterval(t);
  }, [playVideo, reduce, shots.length]);

  if (playVideo) {
    return (
      <video
        src={project.videoUrl}
        poster={project.posterUrl || shots[0]}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        aria-label={`${project.name} app preview`}
        className="absolute inset-0 h-full w-full object-cover object-top"
      />
    );
  }

  return (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.div
        key={shots[shot]}
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="absolute inset-0"
      >
        {shots[shot] && (
          <Image
            src={shots[shot]}
            alt={`${project.name} screenshot`}
            fill
            sizes="320px"
            className="object-cover object-top"
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// HDR: THE DEVICE
// One element. Its size and corner radius spring between forms, the chrome
// for each form fades in on top, and the screen behind is revealed from the
// bottom edge each time it changes.
const Device = ({
  stage,
  stageKey,
  portrait,
  shape,
  ctaHref,
  reduce,
}: {
  stage: Stage;
  stageKey: string;
  portrait: string;
  shape: { width: number; height: number; radius: number };
  ctaHref: string;
  reduce: boolean;
}) => {
  const form = stage.form;
  const project = "project" in stage ? stage.project : null;
  const host = project ? hostOf(project.live) : null;

  const spring = reduce
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 110, damping: 19, mass: 0.9 };

  const screen = (
    <AnimatePresence initial={false}>
      <motion.div
        key={stageKey}
        initial={reduce ? false : { clipPath: "inset(100% 0% 0% 0%)", scale: 1.12 }}
        animate={{ clipPath: "inset(0% 0% 0% 0%)", scale: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.5, delay: 0.35 } }}
        transition={{ duration: 0.95, ease: CURTAIN }}
        className="absolute inset-0"
      >
        {form === "portrait" && (
          <Image
            src={portrait}
            alt="Portrait of Chimezie Nmugha"
            fill
            sizes="34vw"
            className="object-cover object-[50%_28%]"
          />
        )}
        {form === "browser" && project?.img && (
          <ViewTransition name={projectCoverName(project.slug)} share="vt-morph">
            <div className="absolute inset-0">
              <Image
                src={project.img}
                alt={`${project.name} website`}
                fill
                sizes="56vw"
                className="object-cover object-top"
              />
            </div>
          </ViewTransition>
        )}
        {form === "phone" && project && <PhoneScreen project={project} />}
        {form === "pill" && (
          <span className="flex h-full items-center justify-between gap-6 bg-accent px-10 text-accent-on">
            <span className="font-display text-[clamp(1.6rem,2.6vw,2.6rem)] font-semibold leading-[1] tracking-[-0.03em]">
              Your project next?
            </span>
            <span className="grid size-16 shrink-0 place-items-center rounded-full bg-accent-on text-accent transition-transform duration-500 ease-expo group-hover:rotate-45">
              <ArrowUpRight className="size-6" />
            </span>
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );

  const body = (
    <motion.div
      initial={false}
      animate={{ width: shape.width, height: shape.height, borderRadius: shape.radius }}
      transition={spring}
      className={cn(
        "relative overflow-hidden ring-1 ring-white/10",
        form === "pill" ? "bg-accent" : "bg-neutral-950",
        "shadow-[0_40px_90px_-30px_rgb(0_0_0/0.6)]",
      )}
    >
      {/* Browser chrome */}
      <motion.div
        aria-hidden="true"
        initial={false}
        animate={{ opacity: form === "browser" ? 1 : 0, y: form === "browser" ? 0 : -12 }}
        transition={{ duration: 0.45, ease: EASE, delay: form === "browser" ? 0.35 : 0 }}
        className="absolute inset-x-0 top-0 z-20 flex h-10 items-center gap-3 border-b border-white/10 bg-neutral-900 px-4"
      >
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="size-2.5 rounded-full bg-white/20" />
          <span className="size-2.5 rounded-full bg-accent" />
        </span>
        <span className="mx-auto flex h-6 min-w-0 max-w-[60%] items-center gap-2 truncate rounded-full bg-white/[0.07] px-4 font-mono text-[0.7rem] text-white/60">
          {host ?? project?.name}
        </span>
      </motion.div>

      {/* Screen: inset under browser chrome, bezel inside the phone */}
      <motion.div
        initial={false}
        animate={{
          top: form === "browser" ? 40 : form === "phone" ? 9 : 0,
          left: form === "phone" ? 9 : 0,
          right: form === "phone" ? 9 : 0,
          bottom: form === "phone" ? 9 : 0,
          borderRadius: form === "phone" ? 40 : 0,
        }}
        transition={spring}
        className="absolute overflow-hidden bg-neutral-900"
      >
        {screen}
      </motion.div>
    </motion.div>
  );

  if (project) {
    return (
      <Link
        href={routes.public.work(project.slug)}
        aria-label={`Open ${project.name}`}
        onClick={() =>
          trackEvent("Case Study Clicked", { project: project.name, source: "device" })
        }
        className="group block rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        {body}
      </Link>
    );
  }
  if (form === "pill") {
    return (
      <Link
        href={ctaHref}
        onClick={() => trackEvent("Footer CTA Clicked", { cta: "device_pill" })}
        className="group block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        {body}
      </Link>
    );
  }
  return body;
};

// HDR: COPY BESIDE THE DEVICE
const copyIn: Variants = {
  hidden: { y: 40, opacity: 0 },
  visible: (d: number) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 0.8, ease: EASE, delay: 0.15 + d * 0.07 },
  }),
  exit: { y: -24, opacity: 0, transition: { duration: 0.35, ease: CURTAIN } },
};

const ProjectCopy = ({
  project,
  index,
  total,
  form,
  full,
}: {
  project: ProjectDataType;
  index: number;
  total: number;
  form: "browser" | "phone";
  full: boolean;
}) => {
  const both = project.platform === "both";
  const P = both ? { label: "Web + Mobile", icon: Layers } : PLATFORM[form];
  return (
    <div className="flex flex-col gap-6">
      <motion.p custom={0} variants={copyIn} className="flex items-center gap-4 text-sm text-foreground/60">
        <span className="font-mono tabular-nums text-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="h-px w-10 bg-foreground/25" aria-hidden="true" />
        <span className="font-mono tabular-nums">{String(total).padStart(2, "0")}</span>
        <span className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-foreground/15 px-2.5 py-1 text-xs font-medium text-foreground/80">
          <P.icon className="size-3.5" aria-hidden="true" />
          {P.label}
        </span>
      </motion.p>

      <motion.h3
        custom={1}
        variants={copyIn}
        className="font-display text-[clamp(3rem,5.6vw,6rem)] font-semibold leading-[0.9] tracking-[-0.04em]"
      >
        <Link
          href={routes.public.work(project.slug)}
          className="decoration-2 underline-offset-[0.12em] hover:underline"
        >
          {project.name}
        </Link>
      </motion.h3>

      {project.tag && (
        <motion.p custom={2} variants={copyIn} className="text-sm font-medium text-accent-ink">
          {project.tag}
        </motion.p>
      )}

      <motion.p
        custom={3}
        variants={copyIn}
        className="max-w-[44ch] text-base leading-relaxed text-foreground/70 md:text-lg"
      >
        {project.description}
      </motion.p>

      {full && (
        <motion.div custom={4} variants={copyIn}>
          <ProjectRole project={project} maxHighlights={2} />
        </motion.div>
      )}

      {project.stack && project.stack.length > 0 && (
        <motion.ul custom={5} variants={copyIn} className="flex flex-wrap gap-2">
          {project.stack.slice(0, full ? 8 : 5).map((item, i) => (
            <li
              key={`${item}-${i}`}
              className="rounded-full border border-foreground/15 px-3 py-1 text-xs capitalize text-foreground/80 md:text-sm"
            >
              {item}
            </li>
          ))}
        </motion.ul>
      )}

      <motion.div custom={6} variants={copyIn}>
        <ProjectLinks project={project} />
      </motion.div>
    </div>
  );
};

// HDR: MOBILE
// Small screens get no pinning: each project carries its own device, which
// morphs out of the other form as it scrolls into view.
const MobileItem = ({
  project,
  index,
  total,
}: {
  project: ProjectDataType;
  index: number;
  total: number;
}) => {
  const reduce = useReducedMotion();
  const phone = project.platform === "mobile";
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShown(true), {
      threshold: 0.35,
    });
    io.observe(ref);
    return () => io.disconnect();
  }, [ref]);

  const from = phone ? { width: "100%", aspect: 1.55 } : { width: "58%", aspect: 0.48 };
  const to = phone ? { width: "58%", aspect: 0.48 } : { width: "100%", aspect: 1.55 };
  const target = reduce || shown ? to : from;

  return (
    <article ref={setRef} className="flex flex-col gap-6 border-t border-foreground/10 py-12">
      <div className="flex justify-center">
        <motion.div
          initial={false}
          animate={{ width: target.width, borderRadius: (reduce || shown) === phone ? 36 : 16 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 90, damping: 18 }}
          style={{ aspectRatio: String(target.aspect) }}
          className="relative overflow-hidden bg-neutral-950 ring-1 ring-white/10 shadow-[0_30px_60px_-25px_rgb(0_0_0/0.55)]"
        >
          <div className={cn("absolute overflow-hidden", phone ? "inset-[6px] rounded-[30px]" : "inset-x-0 bottom-0 top-7")}>
            {phone ? (
              <PhoneScreen project={project} />
            ) : (
              project.img && (
                <Image
                  src={project.img}
                  alt={`${project.name} website`}
                  fill
                  sizes="100vw"
                  className="object-cover object-top"
                />
              )
            )}
          </div>
          {!phone && (
            <span aria-hidden="true" className="absolute inset-x-0 top-0 flex h-7 items-center gap-1.5 bg-neutral-900 px-3">
              <span className="size-2 rounded-full bg-white/20" />
              <span className="size-2 rounded-full bg-white/20" />
              <span className="size-2 rounded-full bg-accent" />
            </span>
          )}
        </motion.div>
      </div>
      <motion.div
        initial="hidden"
        animate={reduce || shown ? "visible" : "hidden"}
        className="flex flex-col"
      >
        <ProjectCopy
          project={project}
          index={index}
          total={total}
          form={phone ? "phone" : "browser"}
          full={false}
        />
      </motion.div>
    </article>
  );
};

// HDR: JOURNEY
const DeviceJourney = ({
  projects,
  title = "Selected work",
  intro = "Web and mobile, side by side. Keep scrolling: the screen becomes whatever each project shipped on.",
  portrait = "/images/profile-pic.jpg",
  ctaHref = `${routes.public.portfolio}#contact`,
  full = false,
  allWorkHref,
}: {
  projects: ProjectDataType[];
  title?: string;
  intro?: string;
  portrait?: string;
  ctaHref?: string;
  // Portfolio page: role and highlights too
  full?: boolean;
  allWorkHref?: string;
}) => {
  const reduce = useReducedMotion() ?? false;
  const lenis = useLenis();
  const stages = useMemo(() => buildStages(projects), [projects]);
  const ref = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState(0);
  const [vp, setVp] = useState({ w: 1440, h: 900 });

  useLayoutEffect(() => {
    const read = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = Math.min(stages.length - 1, Math.max(0, Math.floor(p * stages.length)));
    if (next !== current) setCurrent(next);
  });

  // Device leans toward the pointer
  const rx = useSpring(useMotionValue(0), { stiffness: 120, damping: 16 });
  const ry = useSpring(useMotionValue(0), { stiffness: 120, damping: 16 });
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 10);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 8);
  };

  if (projects.length === 0) return null;

  const stage = stages[current];
  const shape = shapeOf(stage.form, vp.w, vp.h);
  const project = "project" in stage ? stage.project : null;
  const copyKey = project ? project.slug : stage.form;
  const stageKey = project ? `${project.slug}-${stage.form}` : stage.form;

  // Jump to the first stage of a project
  const goTo = (slug: string) => {
    const el = ref.current;
    if (!el) return;
    const i = stages.findIndex((s) => "project" in s && s.project.slug === slug);
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    const y = top + ((i + 0.5) / stages.length) * span;
    if (lenis) lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <>
      {/* SUB: Desktop: pinned stage */}
      <section
        ref={ref}
        aria-label={title}
        className="relative hidden md:block"
        style={{ height: `${stages.length * 80 + 20}vh` }}
      >
        <div className="sticky top-0 flex h-[100dvh] items-center overflow-hidden">
          <div className="mx-auto grid w-full max-w-[1400px] grid-cols-12 items-center gap-8 px-8">
            {/* Copy */}
            <div className="relative col-span-5 min-h-[30rem]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={copyKey}
                  initial={reduce ? false : "hidden"}
                  animate="visible"
                  exit="exit"
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2"
                >
                  {project && "index" in stage ? (
                    <ProjectCopy
                      project={project}
                      index={stage.index}
                      total={projects.length}
                      form={stage.form as "browser" | "phone"}
                      full={full}
                    />
                  ) : stage.form === "portrait" ? (
                    <div className="flex flex-col gap-6">
                      <motion.h2
                        custom={0}
                        variants={copyIn}
                        className="font-display text-[clamp(3.25rem,7vw,7rem)] font-semibold leading-[0.88] tracking-[-0.045em]"
                      >
                        {title}
                      </motion.h2>
                      <motion.p custom={1} variants={copyIn} className="max-w-[36ch] text-lg leading-relaxed text-foreground/70">
                        {intro}
                      </motion.p>
                      <motion.p custom={2} variants={copyIn} className="flex items-center gap-3 text-sm text-foreground/55">
                        <span className="relative flex h-8 w-5 justify-center rounded-full border border-foreground/30" aria-hidden="true">
                          <motion.span
                            animate={reduce ? undefined : { y: [4, 14, 4] }}
                            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                            className="mt-1 size-1.5 rounded-full bg-accent"
                          />
                        </span>
                        {projects.length} projects ahead
                      </motion.p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      <motion.h2
                        custom={0}
                        variants={copyIn}
                        className="font-display text-[clamp(3.25rem,7vw,7rem)] font-semibold leading-[0.88] tracking-[-0.045em]"
                      >
                        That&apos;s the shortlist
                      </motion.h2>
                      <motion.p custom={1} variants={copyIn} className="max-w-[36ch] text-lg leading-relaxed text-foreground/70">
                        Whatever you need next, a site, an app or both, the
                        screen is ready for it.
                      </motion.p>
                      {allWorkHref && (
                        <motion.div custom={2} variants={copyIn}>
                          <PillLink href={allWorkHref} variant="ghost" icon={<ArrowUpRight />}>
                            View all work
                          </PillLink>
                        </motion.div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Device */}
            <div
              className="relative col-span-7 flex h-[100dvh] items-center justify-center [perspective:1400px]"
              onPointerMove={onMove}
              onPointerLeave={() => {
                rx.set(0);
                ry.set(0);
              }}
            >
              {/* Accent glow that flares as the device changes shape */}
              <motion.span
                key={`glow-${stageKey}`}
                aria-hidden="true"
                initial={reduce ? false : { opacity: 0.9, scale: 1.15 }}
                animate={{ opacity: 0.45, scale: 1 }}
                transition={{ duration: 1.4, ease: EASE }}
                className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--clr)_45%,transparent),transparent)] blur-2xl"
              />
              <motion.div style={reduce ? undefined : { rotateX: rx, rotateY: ry }}>
                <Device
                  stage={stage}
                  stageKey={stageKey}
                  portrait={portrait}
                  shape={shape}
                  ctaHref={ctaHref}
                  reduce={reduce}
                />
              </motion.div>
            </div>
          </div>

          {/* Project rail: where you are, and a way to jump. A slim index
              on the right edge, so it never meets the copy. */}
          <nav
            aria-label="Projects in this sequence"
            className="absolute right-5 top-1/2 hidden -translate-y-1/2 lg:block"
          >
            <ol className="flex flex-col items-end gap-2.5">
              {projects.map((p, i) => {
                const active = project?.slug === p.slug;
                return (
                  <li key={p.slug}>
                    <button
                      type="button"
                      onClick={() => goTo(p.slug)}
                      aria-label={`Go to ${p.name}`}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "group flex items-center gap-2.5 font-mono text-xs tabular-nums transition-colors duration-300",
                        active ? "text-foreground" : "text-foreground/40 hover:text-foreground/80",
                      )}
                    >
                      <span className="pointer-events-none max-w-0 overflow-hidden whitespace-nowrap font-sans opacity-0 transition-[max-width,opacity] duration-500 ease-expo group-hover:max-w-[14rem] group-hover:opacity-100">
                        {p.name}
                      </span>
                      {String(i + 1).padStart(2, "0")}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "h-px transition-[width,background-color] duration-500 ease-expo",
                          active ? "w-6 bg-accent" : "w-2.5 bg-current",
                        )}
                      />
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </section>

      {/* SUB: Mobile: one morphing device per project */}
      <section aria-label={title} className="px-4 md:hidden">
        <h2 className="pb-8 font-display text-[clamp(3rem,13vw,5rem)] font-semibold leading-[0.9] tracking-[-0.04em]">
          {title}
        </h2>
        {projects.map((p, i) => (
          <MobileItem key={p.slug} project={p} index={i} total={projects.length} />
        ))}
        {allWorkHref && (
          <div className="flex justify-end border-t border-foreground/10 py-10">
            <PillLink href={allWorkHref} icon={<ArrowUpRight />}>
              View all work
            </PillLink>
          </div>
        )}
      </section>
    </>
  );
};

export default DeviceJourney;
