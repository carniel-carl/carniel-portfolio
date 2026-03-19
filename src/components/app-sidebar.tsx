"use client";

import * as React from "react";

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
import Image from "next/image";
import Logo from "./general/Logo";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="mt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="group-data-[collapsible=icon]:p-0! mt-2 flex items-center gap-1 hover:bg-transparent">
              <Logo className="size-auto" size="1.5rem" />
              <span className="font-semibold text-2xl ml-1">Carniel</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>{props.children}</SidebarContent>
      <SidebarFooter className="mb-4">
        <AdminThemeSwitcher />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
