import ProjectForm from "@/components/admin/ProjectForm";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import routes from "@/lib/routes";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <>
      <AdminPageHeader title="New project" backHref={routes.admin.projects} backLabel="Projects" />
      <ProjectForm />
    </>
  );
}
