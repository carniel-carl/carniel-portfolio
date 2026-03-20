import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProjectForm from "@/components/admin/ProjectForm";
import BackButton from "@/components/general/BackButton";

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
    <div>
      <div className="flex items-center gap-2 mb-6">
        <BackButton />
        <h2 className="text-2xl font-bold">Edit Project</h2>
      </div>
      <ProjectForm initialData={JSON.parse(JSON.stringify(project))} isEdit />
    </div>
  );
}
