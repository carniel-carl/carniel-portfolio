"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import SplitText from "@/components/motion/SplitText";
import ProjectStack from "@/sections/projects/ProjectStack";
import ProjectGrid from "@/sections/projects/ProjectGrid";
import { ProjectDataType } from "@/types/project";

interface ProjectsClientProps {
  featured: ProjectDataType[];
  other: ProjectDataType[];
  tab?: "featured" | "other";
}

const TABS = [
  { id: "featured", label: "Featured" },
  { id: "other", label: "Other Projects" },
] as const;

const ProjectsClient = ({ featured, other, tab }: ProjectsClientProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const current = tab ?? "featured";
  const list = current === "featured" ? featured : other;

  const handleTabChange = (newTab: "featured" | "other") => {
    if (newTab === "featured") {
      router.replace(pathname, { scroll: false });
    } else {
      router.replace(`${pathname}?tab=${newTab}`, { scroll: false });
    }
  };

  return (
    <section id="projects" className="portfolio flex flex-col pb-24 md:pb-40">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <SplitText
          as="h2"
          text="Projects"
          className="font-display text-[clamp(3.25rem,10vw,9rem)] font-semibold leading-[0.88] tracking-[-0.045em] [font-stretch:75%]"
        />

        {/* SUB: Segmented control with a sliding highlight */}
        <div
          role="tablist"
          aria-label="Project type"
          className="relative flex w-fit shrink-0 rounded-full border border-foreground/15 p-1"
        >
          {TABS.map((t) => {
            const active = current === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => handleTabChange(t.id)}
                className={cn(
                  "relative h-11 rounded-full px-5 text-sm font-medium transition-colors duration-300 active:scale-[0.97]",
                  active ? "text-accent-on" : "text-foreground/70 hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="project-tab"
                    className="absolute inset-0 rounded-full bg-accent"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  {t.label}
                  <span
                    className={cn(
                      "grid min-w-6 place-items-center rounded-full px-1.5 font-mono text-[0.7rem] tabular-nums transition-colors duration-300",
                      active ? "bg-accent-on/15" : "bg-foreground/10",
                    )}
                  >
                    {t.id === "featured" ? featured.length : other.length}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-12 md:mt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {list.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-foreground/20 px-6 py-20 text-center">
                <p className="font-display text-2xl font-medium">Nothing here yet</p>
                <p className="mt-2 text-foreground/65">
                  New projects are added from the admin panel.
                </p>
              </div>
            ) : current === "featured" ? (
              <ProjectStack projects={list} />
            ) : (
              <ProjectGrid projects={list} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default ProjectsClient;
