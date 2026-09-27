"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionStyle,
  type MotionValue,
} from "framer-motion";
import ProjectLinks from "./ProjectLinks";
import type { ProjectDataType } from "@/types/project";

const StackCard = ({
  project,
  index,
  total,
  progress,
}: {
  project: ProjectDataType;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Earlier cards shrink a little more, so the pile reads as depth
  const targetScale = 1 - (total - index - 1) * 0.045;
  const scale = useTransform(progress, [index / total, 1], [1, targetScale]);

  // Image settles from a slight zoom as its card arrives
  const { scrollYProgress: enter } = useScroll({
    target: cardRef,
    offset: ["start end", "start start"],
  });
  const imageScale = useTransform(enter, [0, 1], [1.25, 1]);

  return (
    <div
      ref={cardRef}
      // The pinned wrapper is viewport-tall and mostly transparent. Later
      // wrappers stack on top of earlier cards, so let the pointer pass
      // through them; only the visible card itself is interactive.
      className="md:pointer-events-none md:sticky md:top-0 md:flex md:h-[100dvh] md:items-center"
    >
      <motion.article
        // Stack offset and scale only apply while pinned (md+); on mobile they
        // would push cards out of their flow box and over the next section
        style={
          reduce
            ? undefined
            : ({ scale, "--stack-top": `${index * 1.75}rem` } as MotionStyle)
        }
        className="pointer-events-auto relative grid w-full origin-top max-md:!transform-none md:top-[var(--stack-top,0)] grid-cols-1 gap-8 overflow-hidden rounded-[1.25rem] border border-foreground/[0.07] bg-surface p-4 shadow-[0_-20px_60px_-30px_hsl(var(--foreground)/0.25)] md:grid-cols-12 md:gap-10 md:p-6 lg:p-8"
      >
        <div className="relative aspect-[16/10] overflow-hidden rounded-[0.9rem] bg-background md:col-span-7 md:self-center">
          <motion.div
            style={reduce ? undefined : { scale: imageScale }}
            className="absolute inset-0"
          >
            <Image
              src={project.img}
              alt={project.name}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 55vw"
            />
          </motion.div>
        </div>

        <div className="flex flex-col justify-between gap-8 md:col-span-5 md:py-2">
          <div className="flex flex-col gap-5">
            {project.tag && (
              <p className="text-sm font-medium text-accent-ink">{project.tag}</p>
            )}
            <h3 className="font-display text-4xl font-semibold leading-[1] tracking-[-0.03em] md:text-5xl lg:text-6xl">
              {project.name}
            </h3>
            <p className="max-w-[46ch] text-base leading-relaxed text-foreground/70 md:text-lg">
              {project.description}
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {project.stack && project.stack.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {project.stack.map((item, i) => (
                  <li
                    key={`${item}-${i}`}
                    className="rounded-full border border-foreground/15 px-3 py-1 text-xs capitalize text-foreground/80 md:text-sm"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}
            <ProjectLinks project={project} />
          </div>
        </div>
      </motion.article>
    </div>
  );
};

// Sticky card stack: every card pins at the top of the viewport and recedes
// as the next one slides over it. Collapses to a plain list below md.
const ProjectStack = ({ projects }: { projects: ProjectDataType[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={ref} className="relative flex flex-col gap-8 md:gap-0">
      {projects.map((project, i) => (
        <StackCard
          key={project.name}
          project={project}
          index={i}
          total={projects.length}
          progress={scrollYProgress}
        />
      ))}
    </div>
  );
};

export default ProjectStack;
