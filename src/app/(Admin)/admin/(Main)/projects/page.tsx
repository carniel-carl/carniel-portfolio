import { cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import ProjectsClient from "@/components/admin/ProjectsClient";

async function getProjects() {
  "use cache";
  cacheTag(CACHE_TAGS.projects);
  cacheLife("max");

  const [featured, other] = await prisma.$transaction([
    prisma.project.findMany({
      where: { featured: true },
      orderBy: { order: "asc" },
    }),
    prisma.project.findMany({
      where: { featured: false },
      orderBy: { order: "asc" },
    }),
  ]);

  return {
    featured: JSON.parse(JSON.stringify(featured)),
    other: JSON.parse(JSON.stringify(other)),
  };
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "other" ? "other" : "featured";

  const { featured, other } = await getProjects();

  return (
    <ProjectsClient
      featured={featured}
      other={other}
      activeTab={activeTab}
    />
  );
}
