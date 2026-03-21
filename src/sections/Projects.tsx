import {
  getCachedFeaturedProjects,
  getCachedOtherProjects,
} from "@/lib/actions/projects";
import ProjectsClient from "@/sections/ProjectsClient";
import { cacheTag } from "next/cache";

const Projects = async ({ tab }: { tab?: string }) => {
  const featured = await getCachedFeaturedProjects();
  const other = await getCachedOtherProjects();

  // Map Prisma models to the ProjectDataType shape the client expects
  const mapProject = (p: (typeof featured)[number]) => ({
    name: p.name,
    tag: p.tag || undefined,
    description: p.description,
    img: p.img,
    live: p.live || undefined,
    code: p.code || undefined,
    stack: p.stack,
  });

  return (
    <ProjectsClient
      featured={featured.map(mapProject)}
      other={other.map(mapProject)}
      initialTab={tab}
    />
  );
};

export default Projects;
