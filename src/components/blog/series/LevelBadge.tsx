import { isLevel, LEVEL_LABELS, LEVELS } from "@/lib/blog/levels";
import { cn } from "@/lib/utils";

// Difficulty as filled bars (1 to 3) plus the word, so it reads without colour
export default function LevelBadge({
  level,
  className,
}: {
  level: string | null | undefined;
  className?: string;
}) {
  if (!isLevel(level)) return null;
  const rank = LEVELS.indexOf(level) + 1;

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-foreground/70", className)}>
      <span aria-hidden="true" className="flex items-end gap-[2px]">
        {LEVELS.map((l, i) => (
          <span
            key={l}
            className={cn(
              "w-[3px] rounded-full",
              i === 0 ? "h-1.5" : i === 1 ? "h-2" : "h-2.5",
              i < rank ? "bg-accent-ink dark:bg-accent" : "bg-foreground/20",
            )}
          />
        ))}
      </span>
      {LEVEL_LABELS[level]}
    </span>
  );
}
