"use client";

import type { ReactNode } from "react";
import { ArrowUpRight, FlaskConical, Github } from "lucide-react";
import { SiApple, SiGoogleplay } from "react-icons/si";
import { pillClasses, PillIcon, RollingLabel } from "@/components/motion/PillLink";
import { trackEvent } from "@/lib/mixpanel";
import type { ProjectDataType } from "@/types/project";

type LinkDef = {
  type: string;
  label: string;
  href?: string;
  icon: ReactNode;
  srText: string;
};

// The first available link is the solid primary button; the rest are ghost
const ProjectLinks = ({ project }: { project: ProjectDataType }) => {
  const all: LinkDef[] = [
      { type: "live", label: "Visit site", href: project.live, icon: <ArrowUpRight />, srText: `opens ${project.name}` },
      { type: "app_store", label: "App Store", href: project.appStoreUrl, icon: <SiApple />, srText: `${project.name} on the App Store` },
      { type: "play_store", label: "Google Play", href: project.playStoreUrl, icon: <SiGoogleplay />, srText: `${project.name} on Google Play` },
      { type: "beta", label: "Try the beta", href: project.betaUrl, icon: <FlaskConical />, srText: `${project.name} beta build` },
      { type: "code", label: "Source", href: project.code, icon: <Github />, srText: `${project.name} source code` },
  ];
  const links = all.filter((l): l is LinkDef & { href: string } => Boolean(l.href));

  if (!links.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {links.map((link, i) => {
        const variant = i === 0 ? "solid" : "ghost";
        return (
          <a
            key={link.type}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={pillClasses(variant)}
            onClick={() =>
              trackEvent("Project Link Clicked", {
                project: project.name,
                link_type: link.type,
                url: link.href,
              })
            }
          >
            <RollingLabel>{link.label}</RollingLabel>
            <PillIcon variant={variant}>{link.icon}</PillIcon>
            <span className="sr-only">({link.srText}, new tab)</span>
          </a>
        );
      })}
    </div>
  );
};

export default ProjectLinks;
