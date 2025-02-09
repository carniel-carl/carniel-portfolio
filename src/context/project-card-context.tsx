"use client";
import { ProjectDataType } from "@/types/project";
import { createContext, useContext } from "react";

const ProjectCardContext = createContext<{ project: ProjectDataType } | null>(
  null
);

const useProjectCardContext = () => {
  const context = useContext(ProjectCardContext);
  if (context === null) {
    throw new Error(
      "useProjectCardContext must be used within a ProjectCardContext"
    );
  }
  return context;
};

export { useProjectCardContext };
export default ProjectCardContext;
