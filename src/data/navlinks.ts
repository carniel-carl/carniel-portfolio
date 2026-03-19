import { BsChatDotsFill } from "react-icons/bs";
import { FaTools } from "react-icons/fa";
import { GoPersonFill } from "react-icons/go";
import { MdWork } from "react-icons/md";
import {
  LayoutDashboard,
  FolderKanban,
  Wrench,
  UserCircle,
  PenSquare,
  Share2,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const NavLinks = [
  {
    name: "Blog",
    link: "/blog",
  },
  {
    name: "Portfolio",
    link: "/portfolio",
  },
  // {
  //   name: "About",
  //   link: "/about",
  // },
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
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/skills", label: "Skills", icon: Wrench },
  { href: "/admin/about", label: "About", icon: UserCircle },
  { href: "/admin/blog", label: "Blog", icon: PenSquare },
  { href: "/admin/social", label: "Social Links", icon: Share2 },
  { href: "/admin/users", label: "Users", icon: Users },
];

export { NavLinks, navLinksData, adminNavigation };
