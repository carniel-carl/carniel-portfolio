import ProjectForm from "@/components/admin/ProjectForm";
import PageHeader from "@/components/general/PageHeader";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <PageHeader showBackBtn title="Add New Project" />
      <ProjectForm />
    </div>
  );
}
