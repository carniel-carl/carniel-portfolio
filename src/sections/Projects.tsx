import prisma from "@/lib/prisma";
import ProjectsClient from "./ProjectsClient";

const Projects = async () => {
  const featured = await prisma.project.findMany({
    where: { featured: true },
    orderBy: { order: "asc" },
  });
  const other = await prisma.project.findMany({
    where: { featured: false },
    orderBy: { order: "asc" },
  });

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
    <section id="projects">
      <ProjectsClient
        featured={featured.map(mapProject)}
        other={other.map(mapProject)}
      />
    </section>
  );
};

export default Projects;
