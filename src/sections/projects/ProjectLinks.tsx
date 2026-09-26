"use client";

import { ArrowUpRight, Github } from "lucide-react";
import { pillClasses, PillIcon, RollingLabel } from "@/components/motion/PillLink";
import { trackEvent } from "@/lib/mixpanel";
import type { ProjectDataType } from "@/types/project";

const ProjectLinks = ({ project }: { project: ProjectDataType }) => {
  if (!project.live && !project.code) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {project.live && (
        <a
          href={project.live}
          target="_blank"
          rel="noopener noreferrer"
          className={pillClasses("solid")}
          onClick={() =>
            trackEvent("Project Link Clicked", {
              project: project.name,
              link_type: "live",
              url: project.live,
            })
          }
        >
          <RollingLabel>Visit site</RollingLabel>
          <PillIcon>
            <ArrowUpRight />
          </PillIcon>
          <span className="sr-only">(opens {project.name} in a new tab)</span>
        </a>
      )}
      {project.code && (
        <a
          href={project.code}
          target="_blank"
          rel="noopener noreferrer"
          className={pillClasses("ghost")}
          onClick={() =>
            trackEvent("Project Link Clicked", {
              project: project.name,
              link_type: "code",
              url: project.code,
            })
          }
        >
          <RollingLabel>Source</RollingLabel>
          <PillIcon variant="ghost">
            <Github />
          </PillIcon>
          <span className="sr-only">(view {project.name} source code)</span>
        </a>
      )}
    </div>
  );
};

export default ProjectLinks;
