"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import ProjectLinks from "./ProjectLinks";
import type { ProjectDataType } from "@/types/project";

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
          <div className="relative aspect-[16/11] overflow-hidden rounded-[1.25rem] bg-surface">
            <Image
              src={project.img}
              alt={project.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-top transition-transform duration-[1.2s] ease-expo group-hover:scale-[1.04]"
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-display text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                {project.name}
              </h3>
              {project.tag && (
                <span className="shrink-0 text-sm text-accent-ink">{project.tag}</span>
              )}
            </div>
            <p className="max-w-[52ch] leading-relaxed text-foreground/70">
              {project.description}
            </p>
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
