export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProjectForm from "@/components/admin/ProjectForm";

export default async function EditProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
  });

  if (!project) notFound();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Edit Project</h2>
      <ProjectForm initialData={JSON.parse(JSON.stringify(project))} isEdit />
    </div>
  );
}
