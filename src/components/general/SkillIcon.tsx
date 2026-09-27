import { getIcon } from "@/lib/icon-map";
import { cn } from "@/lib/utils";

export type SkillIconData = {
  iconName: string;
  iconLib: string;
  iconSvg?: string | null;
};

/** Renders a skill's icon, whether it is a stored Iconify SVG or a bundled component. */
export default function SkillIcon({
  icon,
  className,
}: {
  icon: SkillIconData;
  className?: string;
}) {
  if (icon.iconLib === "iconify") {
    if (!icon.iconSvg) return null;
    return (
      <span
        aria-hidden="true"
        className={cn("inline-block", className)}
        // Resolved and checked server-side in the skill actions
        dangerouslySetInnerHTML={{ __html: icon.iconSvg }}
      />
    );
  }

  const Icon = getIcon(icon.iconName);
  return Icon ? <Icon aria-hidden="true" className={className} /> : null;
}
