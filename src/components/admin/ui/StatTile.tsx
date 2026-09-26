import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type StatTileProps = {
  label: string;
  value: number | string;
  detail?: React.ReactNode;
  icon?: LucideIcon;
  href?: string;
  className?: string;
};

/** A single headline number. The number is the chart. */
export default function StatTile({
  label,
  value,
  detail,
  icon: Icon,
  href,
  className,
}: StatTileProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-muted-foreground">
          {label}
        </span>
        {Icon && (
          <Icon
            className="size-4 text-muted-foreground transition-colors duration-300 group-hover:text-accent-ink"
            strokeWidth={1.75}
          />
        )}
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {detail && (
        <p className="mt-1 text-[13px] text-muted-foreground">{detail}</p>
      )}
    </>
  );

  const classes = cn(
    "surface group block p-4",
    href &&
      "surface-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    className,
  );

  return href ? (
    <Link href={href} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}
