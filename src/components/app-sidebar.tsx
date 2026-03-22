"use client";

import * as React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ExternalLink, LogOut } from "lucide-react";

import AdminThemeSwitcher from "@/components/general/AdminThemeSwitcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Logo from "@/components/general/Logo";
import routes from "@/lib/routes";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="mt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="group-data-[collapsible=icon]:p-0! mt-2 flex items-center gap-1 hover:bg-transparent hover:text-sidebar-foreground">
              <Logo className="size-auto" size="1.5rem" />
              <span className="font-semibold text-2xl ml-1">Carniel</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>{props.children}</SidebarContent>
      <SidebarFooter className="mb-4">
        <SidebarMenu className="flex flex-col gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Preview Site" size="lg">
              <Link
                href="/"
                target="_blank"
                className="gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-secondary transition-colors pl-4"
              >
                <ExternalLink className="!size-5" />
                <span>Preview Site</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign Out"
              size="lg"
              onClick={() => signOut({ callbackUrl: routes.admin.login })}
              className="gap-2 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-colors pl-4"
            >
              <LogOut className="!size-5" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <AdminThemeSwitcher />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
