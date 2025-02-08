"use client";
import { slideUpVariant } from "@/components/animations/portfolio-page";
import { featuredProjectData } from "@/data/project-data";
import { motion } from "framer-motion";
import ProjectCard from "@/components/general/ProjectCard";
import { FaGithub } from "react-icons/fa";
import { Radio } from "lucide-react";
import { useState } from "react";

const Projects = () => {
  const [currTab, setCurrTab] = useState<"featured" | "other">("featured");
  return (
    <section id="projects" className="portfolio flex flex-col">
      <motion.h2
        variants={slideUpVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
        className="heading-style after:content-['Explore_my_works'] font-nunito after:font-montserrat md:self-center md:mb-20 mb-12"
      >
        Projects
      </motion.h2>
      <div className="lg:space-y-32 md:space-y-24 space-y-12">
        {featuredProjectData.map((project, index) => {
          const variant = index % 2 === 0 ? "right" : "left";

          return (
            <ProjectCard
              project={project}
              key={project.name}
              variant={variant}
              image={<ProjectCard.Image />}
              info={
                <>
                  <ProjectCard.Title />
                  <ProjectCard.Description />
                  <ProjectCard.Stack variant={variant} />
                </>
              }
              action={
                <>
                  <ProjectCard.ActionButton href={project.live}>
                    <div className="flex items-center gap-2 border-accent border rounded-md px-2 py-0.5 hover:bg-accent duration-200 ease transition-all">
                      <Radio className="size-5" />
                      <span>Live</span>
                      <span className="sr-only">View site</span>
                    </div>
                  </ProjectCard.ActionButton>
                  <ProjectCard.ActionButton href={project.code}>
                    <FaGithub className="size-5" />
                    <span className="sr-only">View source code</span>
                  </ProjectCard.ActionButton>
                </>
              }
            />
          );
        })}
      </div>
    </section>
  );
};

export default Projects;
