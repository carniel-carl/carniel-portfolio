"use client";

import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import ProjectLinks from "./ProjectLinks";
import { ProjectBadges, ProjectRole, isMobileProject } from "./ProjectMeta";
import PhoneShowcase from "@/components/general/PhoneShowcase";
import type { ProjectDataType } from "@/types/project";
import { projectCoverName } from "@/lib/projects/view-transitions";
import routes from "@/lib/routes";

// Staggered two-column gallery: the right column is dropped by a row offset so
// the grid reads as a loose masonry instead of a rigid table.
const ProjectGrid = ({ projects }: { projects: ProjectDataType[] }) => {
  const reduce = useReducedMotion();

  return (
    <ul className="grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2 md:gap-y-24">
      {projects.map((project, i) => (
        <motion.li
          key={project.name}
          initial={reduce ? false : { opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className={cn("group flex flex-col gap-6", i % 2 === 1 && "md:mt-32")}
        >
          <ViewTransition name={projectCoverName(project.slug)} share="vt-morph">
          {isMobileProject(project) && (project.videoUrl || project.screenshots?.length) ? (
            <div className="relative flex aspect-[16/11] items-center justify-center overflow-hidden rounded-[1.25rem] bg-surface bg-[radial-gradient(60%_60%_at_50%_45%,color-mix(in_srgb,var(--clr)_20%,transparent),transparent_75%)] py-6">
              <PhoneShowcase
                name={project.name}
                videoUrl={project.videoUrl}
                posterUrl={project.posterUrl}
                screenshots={project.screenshots}
                fallbackImage={project.img}
                className="h-full"
              />
            </div>
          ) : (
            <div className="relative aspect-[16/11] overflow-hidden rounded-[1.25rem] bg-surface">
              <Image
                src={project.img}
                alt={project.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-top transition-transform duration-[1.2s] ease-expo group-hover:scale-[1.04]"
              />
            </div>
          )}
          </ViewTransition>
          <div className="flex flex-col gap-3">
            <ProjectBadges project={project} />
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-display text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                <Link
                  href={routes.public.work(project.slug)}
                  className="underline-offset-[0.12em] decoration-2 hover:underline"
                >
                  {project.name}
                </Link>
              </h3>
              {project.tag && (
                <span className="shrink-0 text-sm text-accent-ink">{project.tag}</span>
              )}
            </div>
            <p className="max-w-[52ch] leading-relaxed text-foreground/70">
              {project.description}
            </p>
            <ProjectRole project={project} maxHighlights={2} />
            {project.stack && project.stack.length > 0 && (
              <p className="text-sm capitalize text-foreground/55">
                {project.stack.join(", ")}
              </p>
            )}
          </div>
          <ProjectLinks project={project} />
        </motion.li>
      ))}
    </ul>
  );
};

export default ProjectGrid;
