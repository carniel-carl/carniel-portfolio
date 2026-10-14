import { Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

// Marks a kids series on cards and series headers
export default function KidsBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--kid-sun)/0.32)] px-2.5 py-1 text-xs normal-case tracking-normal text-foreground",
        className,
      )}
    >
      <Rocket className="size-3.5" aria-hidden="true" />
      <span className="font-playful">For kids</span>
    </span>
  );
}
