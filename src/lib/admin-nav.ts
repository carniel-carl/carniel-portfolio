import routes from "@/lib/routes";
import {
  BarChart3,
  FolderKanban,
  LayoutDashboard,
  PenSquare,
  Share2,
  Tags,
  UserCircle,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Extra words the command menu should match on */
  keywords?: string[];
};

export type AdminNavGroup = { label: string; items: AdminNavItem[] };

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: routes.admin.dashboard, label: "Dashboard", icon: LayoutDashboard, keywords: ["home"] },
      { href: routes.admin.analytics, label: "Analytics", icon: BarChart3, keywords: ["stats", "traffic", "mixpanel"] },
    ],
  },
  {
    label: "Content",
    items: [
      { href: routes.admin.projects, label: "Projects", icon: FolderKanban, keywords: ["work", "portfolio"] },
      { href: routes.admin.blog, label: "Blog", icon: PenSquare, keywords: ["posts", "writing"] },
      { href: routes.admin.skills, label: "Skills", icon: Wrench, keywords: ["stack", "tools"] },
      { href: routes.admin.about, label: "About", icon: UserCircle, keywords: ["bio", "resume", "profile"] },
      { href: routes.admin.social, label: "Social links", icon: Share2, keywords: ["github", "linkedin", "twitter"] },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: routes.admin.users, label: "Users", icon: Users, keywords: ["admins", "team"] },
    ],
  },
];

export const adminNavItems = adminNavGroups.flatMap((g) => g.items);

/** Human labels for path segments that are not top-level nav items */
const segmentLabels: Record<string, string> = {
  new: "New",
  edit: "Edit",
  preview: "Preview",
  categories: "Categories",
};

export const categoriesNavItem: AdminNavItem = {
  href: routes.admin.blogCategories,
  label: "Blog categories",
  icon: Tags,
};

export function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== routes.admin.dashboard && pathname.startsWith(href));
}

/**
 * Turns /admin/blog/abc123/edit into [Blog → /admin/blog, Edit].
 * Opaque ids are skipped: they carry no meaning for the reader.
 */
export function getBreadcrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean).slice(1); // drop "admin"
  const crumbs: { label: string; href?: string }[] = [];
  let href = "/admin";

  for (const part of parts) {
    href += `/${part}`;
    const nav = adminNavItems.find((i) => i.href === href);
    if (nav) crumbs.push({ label: nav.label, href });
    else if (segmentLabels[part]) crumbs.push({ label: segmentLabels[part], href });
  }

  if (crumbs.length === 0) crumbs.push({ label: "Dashboard" });
  // Last crumb is the current page: not a link
  delete crumbs[crumbs.length - 1].href;
  return crumbs;
}
