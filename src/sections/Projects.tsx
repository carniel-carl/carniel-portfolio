"use client";

import { featuredProjectData, otherProject } from "@/data/project-data";
import { motion } from "framer-motion";
import ProjectCard from "@/components/general/ProjectCard";
import { FaGithub } from "react-icons/fa";
import { Radio } from "lucide-react";
// import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { slideUpVariant } from "@/components/animations/general";
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

      <div className="mb-12">
        <nav className="flex md:justify-center justify-start  gap-3">
          <Button
            onClick={() => setCurrTab("featured")}
            variant={currTab === "featured" ? "default" : "secondary"}
            className={cn("py-1 px-4")}
          >
            Featured
          </Button>
          <Button
            variant={currTab === "other" ? "default" : "secondary"}
            onClick={() => setCurrTab("other")}
            className={cn("py-1 px-4 ")}
          >
            Other Projects
          </Button>
        </nav>
      </div>
      <div className="lg:space-y-32 md:space-y-24 space-y-12">
        {currTab === "featured" &&
          featuredProjectData.map((project, index) => {
            const variant = index % 2 === 0 ? "right" : "left";

            return (
              <ProjectCard
                project={project}
                key={project.name}
                variant={variant}
                image={<ProjectCard.Image />}
                info={
                  <>
                    <ProjectCard.Tag />
                    <ProjectCard.Title />
                    <ProjectCard.Description />
                    <ProjectCard.Stack variant={variant} />
                  </>
                }
                action={
                  <>
                    <ProjectCard.ActionButton href={project.live}>
                      <div
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "py-1 duration-500 ease-in-out"
                        )}
                      >
                        <Radio className="size-5" />
                        <span>Live</span>
                        <span className="sr-only">View site</span>
                      </div>
                    </ProjectCard.ActionButton>
                    <ProjectCard.ActionButton href={project.code}>
                      <FaGithub className="size-6 hover:scale-125 ease duration-300 hover:text-accent" />
                      <span className="sr-only">View source code</span>
                    </ProjectCard.ActionButton>
                  </>
                }
              />
            );
          })}
        {currTab === "other" &&
          otherProject.map((project, index) => {
            const variant = index % 2 === 0 ? "right" : "left";

            return (
              <ProjectCard
                project={project}
                key={project.name}
                variant={variant}
                image={<ProjectCard.Image />}
                info={
                  <>
                    <ProjectCard.Tag />
                    <ProjectCard.Title />
                    <ProjectCard.Description />
                    <ProjectCard.Stack variant={variant} />
                  </>
                }
                action={
                  <>
                    <ProjectCard.ActionButton href={project.live}>
                      <div
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "py-1 duration-500 ease-in-out"
                        )}
                      >
                        <Radio className="size-5" />
                        <span>Live</span>
                        <span className="sr-only">View site</span>
                      </div>
                    </ProjectCard.ActionButton>
                    <ProjectCard.ActionButton href={project.code}>
                      <FaGithub className="size-6 hover:scale-125 ease duration-300 hover:text-accent" />
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
