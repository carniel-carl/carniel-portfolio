import routes from "@/lib/routes";
import {
  BarChart3,
  FolderKanban,
  LayoutDashboard,
  PenSquare,
  Share2,
  UserCircle,
  Users,
  Wrench,
} from "lucide-react";
import { BsChatDotsFill } from "react-icons/bs";
import { FaTools } from "react-icons/fa";
import { GoPersonFill } from "react-icons/go";
import { MdWork } from "react-icons/md";

const NavLinks = [
  {
    name: "Blog",
    link: routes.public.blog,
  },
  {
    name: "Portfolio",
    link: routes.public.portfolio,
  },
];

const navLinksData = {
  id: ".portfolio",
  links: [
    {
      title: "About",
      to: "#",
      icon: GoPersonFill,
    },
    {
      title: "projects",
      to: "#projects",
      icon: MdWork,
    },
    {
      title: "skills",
      to: "#skill",
      icon: FaTools,
    },
    {
      title: "contact",
      to: "#contact",
      icon: BsChatDotsFill,
    },
  ],
};

const adminNavigation = [
  { href: routes.admin.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { href: routes.admin.analytics, label: "Analytics", icon: BarChart3 },
  { href: routes.admin.projects, label: "Projects", icon: FolderKanban },
  { href: routes.admin.skills, label: "Skills", icon: Wrench },
  { href: routes.admin.about, label: "About", icon: UserCircle },
  { href: routes.admin.blog, label: "Blog", icon: PenSquare },
  { href: routes.admin.social, label: "Social Links", icon: Share2 },
  { href: routes.admin.users, label: "Users", icon: Users },
];

export { adminNavigation, NavLinks, navLinksData };
