import { FaReact, FaPython } from "react-icons/fa";
import { BsGit, BsGithub } from "react-icons/bs";
import {
  BiLogoJavascript,
  BiLogoHtml5,
  BiLogoCss3,
  BiLogoDjango,
  BiLogoNodejs,
  BiLogoFirebase,
  BiLogoPostgresql,
  BiLogoMongodb,
} from "react-icons/bi";
import { PiFileSql } from "react-icons/pi";
import {
  SiRedux,
  SiTypescript,
  SiJest,
  SiSass,
  SiTailwindcss,
  SiWebpack,
  SiSqlite,
  SiReactrouter,
  SiNextdotjs,
} from "react-icons/si";
import { IconType } from "react-icons";

export const iconMap: Record<string, IconType> = {
  FaReact,
  FaPython,
  BsGit,
  BsGithub,
  BiLogoJavascript,
  BiLogoHtml5,
  BiLogoCss3,
  BiLogoDjango,
  BiLogoNodejs,
  BiLogoFirebase,
  BiLogoPostgresql,
  BiLogoMongodb,
  PiFileSql,
  SiRedux,
  SiTypescript,
  SiJest,
  SiSass,
  SiTailwindcss,
  SiWebpack,
  SiSqlite,
  SiReactrouter,
  SiNextdotjs,
};

export const iconList = Object.entries(iconMap).map(([name, icon]) => {
  const lib = name.startsWith("Fa")
    ? "fa"
    : name.startsWith("Bs")
      ? "bs"
      : name.startsWith("Bi")
        ? "bi"
        : name.startsWith("Pi")
          ? "pi"
          : "si";
  return { name, lib, icon };
});

export function getIcon(iconName: string): IconType | null {
  return iconMap[iconName] || null;
}
