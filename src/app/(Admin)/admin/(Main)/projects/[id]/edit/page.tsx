import ProjectForm from "@/components/admin/ProjectForm";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import prisma from "@/lib/prisma";
import routes from "@/lib/routes";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Edit project" };

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });

  if (!project) notFound();

  return (
    <>
      <AdminPageHeader title={project.name} backHref={routes.admin.projects} backLabel="Projects" />
      <ProjectForm initialData={JSON.parse(JSON.stringify(project))} isEdit />
    </>
  );
}
