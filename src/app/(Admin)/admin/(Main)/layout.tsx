import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import AdminHeader from "@/components/general/AdminHeader";
import MaxWidth from "@/components/general/MaxWidth";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";

async function SidebarWithAuth() {
  const session = await auth();
  return <AdminSidebar session={session} />;
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar children={<SidebarWithAuth />} />
      <SidebarInset>
        <SiteHeader children={<AdminHeader />} />
        <MaxWidth
          className="md:w-[96%]  mt-20 md:mt-24 mb-4"
          children={children}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={null}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
};

export default AdminLayout;
