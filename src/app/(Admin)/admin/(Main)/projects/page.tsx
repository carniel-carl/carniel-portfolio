import { getCachedAllProjects } from "@/lib/actions/projects";
import ProjectsClient from "@/components/admin/ProjectsClient";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "other" ? "other" : "featured";

  const { featured, other } = await getCachedAllProjects();

  return (
    <ProjectsClient featured={featured} other={other} activeTab={activeTab} />
  );
}
