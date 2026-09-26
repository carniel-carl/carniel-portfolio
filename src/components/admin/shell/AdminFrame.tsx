import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar, { type AdminUser } from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { CommandMenuProvider } from "./CommandMenu";

type AdminFrameProps = {
  user: AdminUser;
  badges?: Record<string, number>;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

/** Sidebar + pinned header + band sheet. Data fetching stays in the layout. */
export default function AdminFrame({ user, badges, defaultOpen = true, children }: AdminFrameProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <CommandMenuProvider>
        <AdminSidebar user={user} badges={badges} />
        {/* data-band: page headers render as a full-bleed band and the first
            block after them overlaps its lower edge (see admin.css). The
            gradient matches the band at the top so the sheet corners show no seam. */}
        <SidebarInset
          data-band
          className="min-w-0 overflow-x-clip bg-[linear-gradient(to_bottom,hsl(var(--brand-surface))_0,hsl(var(--brand-surface))_14rem,hsl(var(--background))_14rem)] md:peer-data-[variant=inset]:shadow-none"
        >
          <AdminTopbar />
          <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 md:px-8">{children}</div>
        </SidebarInset>
      </CommandMenuProvider>
    </SidebarProvider>
  );
}
