import { AppSidebar } from "@/components/app-sidebar";
import AdminHeader from "@/components/general/AdminHeader";
import MaxWidth from "@/components/general/MaxWidth";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();
  return (
    <>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar children={<AdminSidebar session={session} />} />
        <SidebarInset>
          <SiteHeader children={<AdminHeader />} />
          <MaxWidth
            // as="main"
            className="md:w-[96%]  mt-20 mb-4"
            children={children}
          />
        </SidebarInset>
      </SidebarProvider>
    </>
  );
};

export default AdminLayout;

/*  <SidebarProvider defaultOpen={false}>
        <AppSidebar children={<AdminSidebar session={session} />} />
        <SidebarInset>
          <SiteHeader children={<AdminHeader />} />
          <MaxWidth
            // as="main"
            className="md:w-[96%] md:mt-24 mt-20 mb-4"
            children={children}
          />
        </SidebarInset>
      </SidebarProvider>

*/
