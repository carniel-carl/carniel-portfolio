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

const AdminSidebar = () => {
  const { setOpenMobile } = useSidebar();
  const pathName = usePathname();

  // const isSuperAdmin = session?.user?.isAdmin;

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
