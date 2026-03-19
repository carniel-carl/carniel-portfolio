export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import ProjectsClient from "@/components/admin/ProjectsClient";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({ orderBy: { order: "asc" } });

  return <ProjectsClient projects={JSON.parse(JSON.stringify(projects))} />;
}
