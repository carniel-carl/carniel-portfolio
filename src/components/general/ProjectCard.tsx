"use client";
import ProjectCardContext, {
  useProjectCardContext,
} from "@/context/project-card-context";
import { cn } from "@/lib/utils";
import { ProjectCardTypes } from "@/types/project";
import Image from "next/image";
import Link from "next/link";
import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { staggerContainer } from "@/components/animations/portfolio-page";
import { slideLeftVariant, slideRightVariant } from "../animations/general";

type PropsVariantType = "left" | "right";

// HDR: Project Card
const ProjectCard = ({
  project,
  image,
  info,
  action,
  variant,
}: ProjectCardTypes) => {
  const isRight = variant === "right";

  return (
    <ProjectCardContext.Provider value={{ project }}>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        className={cn(
          "grid grid-cols-1 gap-y-4",
          isRight ? "md:grid-cols-[1fr_1.3fr]" : "md:grid-cols-[1.3fr_1fr]"
        )}
      >
        <motion.div
          variants={isRight ? slideRightVariant : slideLeftVariant}
          className={cn(
            "flex flex-col gap-4 py-4 relative md:-right-[1.5rem] z-[3]",
            isRight
              ? "md:right-[1.5rem] order-1  md:text-right md:items-end"
              : "order-1 md:-order-1"
          )}
        >
          {info}
          <div className="flex items-center gap-4 mt-4 md:justify-start justify-center">
            {action}
          </div>
        </motion.div>
        <motion.div variants={isRight ? slideLeftVariant : slideRightVariant}>
          {image}
        </motion.div>
      </motion.div>
    </ProjectCardContext.Provider>
  );
};

// HDR: Project Title
const ProjectTitle = () => {
  const { project } = useProjectCardContext();
  return <h3 className="lg:text-2xl text-xl font-semibold">{project.name}</h3>;
};

// HDR: Project Description
const ProjectDescription = () => {
  const { project } = useProjectCardContext();
  return (
    <p className="p-4 dark:bg-neutral-900 bg-neutral-300 rounded-md shadow-lg text-foreground font-medium">
      {project.description}
    </p>
  );
};

// HDR: Project Stack
const ProjectStack: React.FC<{
  variant: PropsVariantType;
}> = ({ variant }) => {
  const isRight = variant === "right";
  const { project } = useProjectCardContext();
  return (
    <ul
      className={cn(
        "flex flex-wrap gap-x-12 gap-y-2 opacity-90 list-disc pl-5 disc ",
        isRight ? "md:justify-end" : ""
      )}
    >
      {project.stack?.map((item, index) => (
        <li
          key={`${item} ${index}`}
          className="capitalize marker:text-accent text-sm font-normal"
        >
          {item}
        </li>
      ))}
    </ul>
  );
};

// HDR: Project Image
const ProjectImage = () => {
  const { project } = useProjectCardContext();
  return (
    <div className="relative w-full lg:h-[20rem] md:h-[16rem] h-[12rem] group md:hover:shadow-lg">
      <Image
        src={project.img}
        alt={project.name}
        fill
        className="object-cover rounded-md filter grayscale brightness-10 group-hover:filter-none group-hover:brightness-10 transition duration-500"
      />
    </div>
  );
};

const ProjectTag = () => {
  const { project } = useProjectCardContext();
  return <small className="text-sm uppercase text-accent">{project.tag}</small>;
};

// HDR: Project Action
const ProjectActionButton: React.FC<{
  children: ReactNode;
  href: string;
}> = ({ children, href }) => {
  return <Link href={href}>{children}</Link>;
};

ProjectCard.Tag = ProjectTag;
ProjectCard.Title = ProjectTitle;
ProjectCard.Description = ProjectDescription;
ProjectCard.Image = ProjectImage;
ProjectCard.Stack = ProjectStack;
ProjectCard.ActionButton = ProjectActionButton;

export default ProjectCard;
