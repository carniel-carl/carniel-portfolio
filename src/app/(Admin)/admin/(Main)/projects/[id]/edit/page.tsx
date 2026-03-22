import ProjectForm from "@/components/admin/ProjectForm";
import PageHeader from "@/components/general/PageHeader";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <PageHeader showBackBtn title="Edit Project" />
      <ProjectForm initialData={JSON.parse(JSON.stringify(project))} isEdit />
    </div>
  );
}
