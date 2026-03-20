"use client";

import { Session } from "next-auth";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { adminNavigation } from "@/data/navlinks";
import Link from "next/link";
import { cn } from "@/lib/utils";

const AdminSidebar = ({ session }: { session: Session | null }) => {
  const { setOpenMobile } = useSidebar();
  const pathName = usePathname();

  const isSuperAdmin = session?.user?.isAdmin;

  const getIsActive = (url: string) => {
    const isActive =
      pathName === url || (url !== "/admin" && pathName.startsWith(url));
    return isActive;
  };

  return (
    <>
      <SidebarGroup className="mt-10">
        <SidebarGroupContent>
          <SidebarMenu className="flex flex-col gap-2">
            {adminNavigation.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.label}
                  key={item.label}
                  onClick={() => setOpenMobile(false)}
                  size={"lg"}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      getIsActive(item.href)
                        ? "bg-sidebar-primary text-sidebar-accent-foreground font-medium hover:bg-sidebar-primary/80"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-secondary",
                      "gap-2 transition-colors pl-4",
                    )}
                  >
                    {item.icon && (
                      <item.icon
                        className="!size-5"
                        color={
                          getIsActive(item.href) ? "currentColor" : undefined
                        }
                      />
                    )}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
};

export default AdminSidebar;

/* 
   <div className="p-3 border-t">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mb-1"
          >
            View Site
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors w-full"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>


      <SidebarGroup className="mt-10">
        <SidebarGroupContent>
          <SidebarMenu className="flex flex-col gap-2">
            {adminNavigation.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.label}
                  key={item.label}
                  onClick={() => setOpenMobile(false)}
                  size={"lg"}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      getIsActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground",
                      // getIsActive(item.href) &&
                      //   "bg-black font-semibold text-white hover:!bg-black/90 hover:!text-white [&>svg]:!opacity-100 dark:bg-primary dark:text-black hover:dark:!bg-primary/90 hover:dark:!text-black ",
                      "gap-2 ",
                    )}
                  >
                    {item.icon && (
                      <item.icon
                        className="!size-5"
                        color={
                          getIsActive(item.href) ? "currentColor" : undefined
                        }
                      />
                    )}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
*/
