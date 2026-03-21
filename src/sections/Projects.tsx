// import { cacheTag, cacheLife } from "next/cache";
// import { CACHE_TAGS } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";
import ProjectsClient from "@/sections/ProjectsClient";

const Projects = async () => {
  // "use cache: remote";
  // cacheTag(CACHE_TAGS.projects);
  // cacheLife("max");
  const featured = await prisma.project.findMany({
    where: { featured: true, visible: { not: false } },
    orderBy: { order: "asc" },
  });
  const other = await prisma.project.findMany({
    where: { featured: false, visible: { not: false } },
    orderBy: { order: "asc" },
  });

  console.log("=====I rendered Projects=======");

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
    />
  );
};

export default Projects;
