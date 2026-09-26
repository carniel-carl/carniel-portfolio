"use client";

import SVGIcon from "@/components/general/SVGIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { adminNavGroups, isActivePath } from "@/lib/admin-nav";
import routes from "@/lib/routes";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronsUpDown, ExternalLink, LogOut, Search } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Kbd, useCommandMenu } from "./CommandMenu";

export type AdminUser = {
  name: string;
  email: string;
  isSuperAdmin: boolean;
};

type AdminSidebarProps = {
  user: AdminUser;
  /** Small counts shown next to nav items, keyed by href */
  badges?: Record<string, number>;
};

export default function AdminSidebar({ user, badges = {} }: AdminSidebarProps) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const { setOpen: setCommandOpen } = useCommandMenu();
  const reduceMotion = useReducedMotion();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="gap-3 pt-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="hover:bg-transparent active:bg-transparent group-data-[collapsible=icon]:!p-1.5"
            >
              <Link href={routes.admin.dashboard}>
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-foreground text-accent">
                  <SVGIcon width="1.1rem" height="1.1rem" />
                </span>
                <span className="grid leading-tight">
                  <span className="font-display text-[15px] font-semibold tracking-tight text-foreground">
                    Carniel
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Content studio
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <button
          type="button"
          onClick={() => {
            setOpenMobile(false);
            setCommandOpen(true);
          }}
          className="flex h-9 items-center gap-2 rounded-md border bg-card px-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:hidden"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Search</span>
          <Kbd>⌘K</Kbd>
        </button>
      </SidebarHeader>

      <SidebarContent>
        {adminNavGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[11px] font-medium text-muted-foreground/80">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  const badge = badges[item.href];
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                        className={cn(
                          "relative isolate h-9 gap-3 font-normal text-sidebar-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                          "data-[active=true]:bg-transparent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground",
                        )}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setOpenMobile(false)}
                          aria-current={active ? "page" : undefined}
                        >
                          {active && (
                            <motion.span
                              layoutId={isMobile ? undefined : "admin-nav-active"}
                              transition={
                                reduceMotion
                                  ? { duration: 0 }
                                  : { type: "spring", stiffness: 500, damping: 40 }
                              }
                              className="absolute inset-0 -z-10 rounded-md bg-sidebar-accent"
                            />
                          )}
                          <item.icon
                            className={cn(
                              "!size-[18px] transition-colors",
                              active ? "text-accent-ink" : "text-muted-foreground",
                            )}
                            strokeWidth={1.75}
                          />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {!!badge && (
                        <SidebarMenuBadge className="tnum rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">
                          {badge}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="pb-3">
        <UserMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function initials(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "A";
}

function UserMenu({ user }: { user: AdminUser }) {
  const { isMobile } = useSidebar();
  const { theme, setTheme } = useTheme();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="gap-2.5 hover:bg-sidebar-accent/70 data-[state=open]:bg-sidebar-accent group-data-[collapsible=icon]:!p-1.5"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-on">
                {initials(user.name, user.email)}
              </span>
              <span className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium text-foreground">
                  {user.name || "Admin"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.isSuperAdmin ? "Super admin" : "Admin"}
                </span>
              </span>
              <ChevronsUpDown className="ml-auto !size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? "top" : "right"}
            align="end"
            sideOffset={8}
            className="w-60 rounded-xl"
          >
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-medium">{user.name || "Admin"}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="pb-1 text-xs font-normal text-muted-foreground">
              Theme
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/" target="_blank" rel="noopener">
                <ExternalLink className="size-4" />
                View live site
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => signOut({ callbackUrl: routes.admin.login })}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
