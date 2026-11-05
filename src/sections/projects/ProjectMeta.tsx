import { Smartphone, Globe, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectDataType } from "@/types/project";

const STATUS: Record<NonNullable<ProjectDataType["status"]>, { label: string; tone: string }> = {
  live: { label: "Live", tone: "bg-emerald-500" },
  beta: { label: "In beta", tone: "bg-sky-500" },
  prototype: { label: "Prototype", tone: "bg-violet-500" },
  internal: { label: "Internal app", tone: "bg-amber-500" },
  "in-development": { label: "In development", tone: "bg-foreground/40" },
};

const PLATFORM = {
  web: { label: "Web", icon: Globe },
  mobile: { label: "Mobile app", icon: Smartphone },
  both: { label: "Web + Mobile", icon: Layers },
} as const;

export const isMobileProject = (p: ProjectDataType) =>
  p.platform === "mobile" || p.platform === "both";

// Platform + status chips. The status dot is real state, not decoration.
export function ProjectBadges({ project, className }: { project: ProjectDataType; className?: string }) {
  const platform = PLATFORM[project.platform ?? "web"];
  const status = project.status ? STATUS[project.status] : null;
  if (project.platform === "web" && !status) return null;
  const Icon = platform.icon;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {project.platform !== "web" && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 px-2.5 py-1 text-xs font-medium text-foreground/80">
          <Icon className="size-3.5" aria-hidden="true" />
          {platform.label}
        </span>
      )}
      {status && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 px-2.5 py-1 text-xs font-medium text-foreground/80">
          <span className={cn("size-1.5 rounded-full", status.tone)} aria-hidden="true" />
          {status.label}
        </span>
      )}
    </div>
  );
}

// "Mobile developer, Team of 6 at Acme" plus the first few highlights
export function ProjectRole({
  project,
  maxHighlights = 3,
}: {
  project: ProjectDataType;
  maxHighlights?: number;
}) {
  const highlights = (project.highlights ?? []).filter(Boolean).slice(0, maxHighlights);
  const roleLine = [project.role, project.team].filter(Boolean).join(", ");
  if (!roleLine && !highlights.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {roleLine && (
        <p className="text-sm text-foreground/60">
          <span className="font-medium text-foreground/85">My role:</span> {roleLine}
        </p>
      )}
      {highlights.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {highlights.map((h) => (
            <li key={h} className="flex gap-2.5 text-sm leading-relaxed text-foreground/75 md:text-[0.95rem]">
              <span className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              {h}
            </li>
          ))}
        </ul>
      )}
      {project.status === "internal" && (
        <p className="text-xs text-foreground/50">Company app under NDA, shown with sample data.</p>
      )}
    </div>
  );
}
