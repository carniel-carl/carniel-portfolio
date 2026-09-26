"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import SplitText from "@/components/motion/SplitText";
import PillLink from "@/components/motion/PillLink";
import routes from "@/lib/routes";
import { trackEvent } from "@/lib/mixpanel";
import type { ProjectDataType } from "@/types/project";

// Index list of featured work. On desktop a preview window trails the cursor
// and its image strip slides to whichever row is hovered.
const SelectedWork = ({ projects }: { projects: ProjectDataType[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 150, damping: 20, mass: 0.5 });
  const y = useSpring(useMotionValue(0), { stiffness: 150, damping: 20, mass: 0.5 });

  if (projects.length === 0) return null;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set(e.clientX - r.left);
    y.set(e.clientY - r.top);
  };

  return (
    <section className="mx-auto max-w-[1400px] px-4 pb-24 md:px-8 md:pb-40">
      <SplitText
        as="h2"
        text="Selected work"
        className="font-display text-[clamp(3rem,9vw,8.5rem)] font-semibold leading-[0.9] tracking-[-0.04em] [font-stretch:75%]"
      />

      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={() => setActive(null)}
        className="relative mt-12 md:mt-20"
      >
        <ul className="border-b border-foreground/10">
          {projects.map((project, i) => {
            const href = project.live ?? project.code ?? routes.public.portfolio;
            const external = href.startsWith("http");
            return (
              <motion.li
                key={project.name}
                initial={reduce ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 }}
                className="border-t border-foreground/10"
              >
                <a
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() =>
                    trackEvent("Project Link Clicked", {
                      project: project.name,
                      link_type: project.live ? "live" : "code",
                      url: href,
                      source_page: "home",
                    })
                  }
                  className="group grid grid-cols-1 gap-4 py-8 focus-visible:outline-none md:grid-cols-12 md:items-center md:gap-6 md:py-10"
                >
                  {/* Mobile: inline thumbnail instead of the cursor preview */}
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[1.25rem] bg-surface md:hidden">
                    <Image
                      src={project.img}
                      alt={project.name}
                      fill
                      sizes="100vw"
                      className="object-cover object-top"
                    />
                  </div>

                  <h3 className="font-display text-4xl font-semibold leading-[1.05] tracking-[-0.03em] transition-transform duration-700 ease-expo group-hover:translate-x-4 group-focus-visible:translate-x-4 md:col-span-7 md:text-6xl lg:text-7xl">
                    {project.name}
                  </h3>
                  <p className="text-sm text-foreground/60 md:col-span-4 md:text-base">
                    {project.tag ?? project.stack?.slice(0, 3).join(", ")}
                  </p>
                  <span className="hidden size-12 place-items-center justify-self-end rounded-full border border-foreground/15 transition-[transform,background-color,color,border-color] duration-500 ease-expo group-hover:rotate-45 group-hover:border-transparent group-hover:bg-accent group-hover:text-accent-on md:col-span-1 md:grid">
                    <ArrowUpRight className="size-5" />
                  </span>
                </a>
              </motion.li>
            );
          })}
        </ul>

        {/* SUB: Cursor-following preview (desktop, fine pointer only) */}
        {!reduce && (
          <motion.div
            aria-hidden="true"
            style={{ x, y }}
            className="pointer-events-none absolute left-0 top-0 z-10 hidden md:block"
          >
            <div className="-translate-x-1/2 -translate-y-1/2">
            <motion.div
              initial={false}
              animate={{
                scale: active === null ? 0 : 1,
                opacity: active === null ? 0 : 1,
              }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden rounded-[1.25rem] shadow-[0_30px_80px_-20px_hsl(var(--foreground)/0.35)]"
              style={{ width: "min(28vw, 26rem)", aspectRatio: "16 / 10" }}
            >
              <motion.div
                animate={{ y: `${-(active ?? 0) * 100}%` }}
                transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
                className="absolute inset-0"
              >
                {projects.map((p, i) => (
                  <div
                    key={p.name}
                    className="absolute inset-x-0 h-full"
                    style={{ top: `${i * 100}%` }}
                  >
                    <Image
                      src={p.img}
                      alt=""
                      fill
                      sizes="28vw"
                      className="object-cover object-top"
                    />
                  </div>
                ))}
              </motion.div>
            </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="mt-12 flex justify-end">
        <PillLink href={routes.public.portfolio} icon={<ArrowUpRight />}>
          View work
        </PillLink>
      </div>
    </section>
  );
};

export default SelectedWork;
