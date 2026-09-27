"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Globe, Smartphone } from "lucide-react";
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
  const [platform, setPlatform] = useState<"all" | "web" | "mobile">("all");

  // "both" projects count as web AND mobile
  const matches = (p: ProjectDataType, f: typeof platform) =>
    f === "all" ||
    (f === "mobile" ? p.platform === "mobile" || p.platform === "both" : p.platform !== "mobile");
  const tabList = current === "featured" ? featured : other;
  const list = tabList.filter((p) => matches(p, platform));
  const hasMobile = [...featured, ...other].some((p) => matches(p, "mobile"));
  const FILTERS = [
    { id: "all", label: "All", icon: null },
    { id: "web", label: "Web", icon: Globe },
    { id: "mobile", label: "Mobile", icon: Smartphone },
  ] as const;

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

      {/* Platform filter: only once there are mobile projects to filter by */}
      {hasMobile && (
        <div
          role="radiogroup"
          aria-label="Filter by platform"
          className="mt-8 flex w-fit flex-wrap gap-2"
        >
          {FILTERS.map((f) => {
            const active = platform === f.id;
            const count = tabList.filter((p) => matches(p, f.id)).length;
            const Icon = f.icon;
            return (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPlatform(f.id)}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors active:scale-[0.97]",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-foreground/15 text-foreground/70 hover:border-foreground/40 hover:text-foreground",
                )}
              >
                {Icon && <Icon className="size-3.5" aria-hidden="true" />}
                {f.label}
                <span className={cn("font-mono text-[0.7rem] tabular-nums", active ? "opacity-70" : "opacity-60")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-12 md:mt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${current}-${platform}`}
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
