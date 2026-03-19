export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import ProjectsClient from "@/components/admin/ProjectsClient";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "other" ? "other" : "featured";

  const featured = await prisma.project.findMany({
    where: { featured: true },
    orderBy: { order: "asc" },
  });
  const other = await prisma.project.findMany({
    where: { featured: false },
    orderBy: { order: "asc" },
  });

  return (
    <ProjectsClient
      featured={JSON.parse(JSON.stringify(featured))}
      other={JSON.parse(JSON.stringify(other))}
      activeTab={activeTab}
    />
  );
}
