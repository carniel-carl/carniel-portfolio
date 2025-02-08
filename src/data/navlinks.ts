import { BsChatDotsFill } from "react-icons/bs";
import { FaTools } from "react-icons/fa";
import { GoPersonFill } from "react-icons/go";
import { MdWork } from "react-icons/md";

export const NavLinks = [
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

export const navLinksData = {
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
