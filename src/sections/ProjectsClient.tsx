"use client";

import { motion } from "framer-motion";
import ProjectCard from "@/components/general/ProjectCard";
import { FaGithub } from "react-icons/fa";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { slideUpVariant } from "@/components/animations/general";
import { ProjectDataType } from "@/types/project";
import { useRouter, usePathname } from "next/navigation";
import { trackEvent } from "@/lib/mixpanel";

interface ProjectsClientProps {
  featured: ProjectDataType[];
  other: ProjectDataType[];
  tab?: "featured" | "other";
}

const ProjectsClient = ({ featured, other, tab }: ProjectsClientProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleTabChange = (newTab: "featured" | "other") => {
    if (newTab === "featured") {
      router.replace(pathname, { scroll: false });
    } else {
      router.replace(`${pathname}?tab=${newTab}`, { scroll: false });
    }
  };

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
        <nav className="flex md:justify-center justify-start gap-3">
          <Button
            onClick={() => handleTabChange("featured")}
            variant={tab === "featured" || !tab ? "default" : "secondary"}
            className={cn("py-1 px-4")}
          >
            Featured
          </Button>
          <Button
            variant={tab === "other" ? "default" : "secondary"}
            onClick={() => handleTabChange("other")}
            className={cn("py-1 px-4")}
          >
            Other Projects
          </Button>
        </nav>
      </div>
      <div className="lg:space-y-32 md:space-y-24 space-y-12">
        {tab === "featured" &&
          featured.map((project, index) => {
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
                    <span
                      onClick={() =>
                        trackEvent("Project Link Clicked", {
                          project: project.name,
                          link_type: "live",
                          url: project.live,
                        })
                      }
                    >
                      <ProjectCard.ActionButton href={project.live}>
                        <div
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "py-1 duration-500 ease-in-out",
                          )}
                        >
                          <Radio className="size-5" />
                          <span>Live</span>
                          <span className="sr-only">View site</span>
                        </div>
                      </ProjectCard.ActionButton>
                    </span>
                    <span
                      onClick={() =>
                        trackEvent("Project Link Clicked", {
                          project: project.name,
                          link_type: "code",
                          url: project.code,
                        })
                      }
                    >
                      <ProjectCard.ActionButton href={project.code}>
                        <FaGithub className="size-6 hover:scale-125 ease duration-300 hover:text-accent" />
                        <span className="sr-only">View source code</span>
                      </ProjectCard.ActionButton>
                    </span>
                  </>
                }
              />
            );
          })}
        {tab === "other" &&
          other.map((project, index) => {
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
                    <span
                      onClick={() =>
                        trackEvent("Project Link Clicked", {
                          project: project.name,
                          link_type: "live",
                          url: project.live,
                        })
                      }
                    >
                      <ProjectCard.ActionButton href={project.live}>
                        <div
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "py-1 duration-500 ease-in-out",
                          )}
                        >
                          <Radio className="size-5" />
                          <span>Live</span>
                          <span className="sr-only">View site</span>
                        </div>
                      </ProjectCard.ActionButton>
                    </span>
                    <span
                      onClick={() =>
                        trackEvent("Project Link Clicked", {
                          project: project.name,
                          link_type: "code",
                          url: project.code,
                        })
                      }
                    >
                      <ProjectCard.ActionButton href={project.code}>
                        <FaGithub className="size-6 hover:scale-125 ease duration-300 hover:text-accent" />
                        <span className="sr-only">View source code</span>
                      </ProjectCard.ActionButton>
                    </span>
                  </>
                }
              />
            );
          })}
      </div>
    </section>
  );
};

export default ProjectsClient;
