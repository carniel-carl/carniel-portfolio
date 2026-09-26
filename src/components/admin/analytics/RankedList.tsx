import EmptyState from "@/components/admin/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type RankedRow = { label: string; value: number };

type RankedListProps = {
  title: string;
  unit: string;
  rows: RankedRow[];
  icon: LucideIcon;
  emptyText: string;
  limit?: number;
  className?: string;
};

/**
 * Ranked magnitude as a list with inline bars.
 * One series, one hue. Values are always printed, so nothing depends on
 * hover or on colour; hover adds the share of total.
 */
export default function RankedList({
  title,
  unit,
  rows,
  icon,
  emptyText,
  limit = 8,
  className,
}: RankedListProps) {
  const visible = rows.slice(0, limit);
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  const max = visible[0]?.value ?? 0;

  return (
    <section className={cn("surface p-5", className)}>
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {total > 0 && (
          <span className="tnum text-xs text-muted-foreground">
            {total.toLocaleString()} {unit}
          </span>
        )}
      </header>

      {visible.length === 0 ? (
        <EmptyState compact icon={icon} title="No data yet" description={emptyText} />
      ) : (
        <ol className="space-y-1">
          {visible.map((row, i) => {
            const share = total ? Math.round((row.value / total) * 100) : 0;
            return (
              <li
                key={row.label}
                className="group rounded-md px-2 py-1.5 transition-colors hover:bg-muted/70"
              >
                <div className="flex items-baseline gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate text-foreground" title={row.label}>
                    {row.label}
                  </span>
                  <span className="tnum text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    {share}%
                  </span>
                  <span className="tnum w-10 text-right font-medium text-foreground">
                    {row.value.toLocaleString()}
                  </span>
                </div>
                <div
                  aria-hidden
                  className="admin-bar mt-1.5 h-1.5 rounded-full bg-accent-ink"
                  style={{
                    width: `${Math.max((row.value / max) * 100, 2)}%`,
                    animationDelay: `${i * 40}ms`,
                  }}
                />
              </li>
            );
          })}
        </ol>
      )}

      {rows.length > limit && (
        <p className="mt-3 px-2 text-xs text-muted-foreground">
          + {rows.length - limit} more not shown
        </p>
      )}
    </section>
  );
}
