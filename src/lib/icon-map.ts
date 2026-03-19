import { icons, type LucideIcon } from "lucide-react";
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
import { type IconType } from "react-icons";

// Legacy react-icons map (for existing skills saved with these names)
const legacyIcons: Record<string, IconType> = {
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

// Full Lucide icon names for the admin picker
export const iconNames: string[] = Object.keys(icons).sort();

// Look up an icon by name — checks Lucide first, then legacy react-icons
export function getIcon(
  iconName: string
): LucideIcon | IconType | null {
  return (
    icons[iconName as keyof typeof icons] ??
    legacyIcons[iconName] ??
    null
  );
}
