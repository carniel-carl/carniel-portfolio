import { cn } from "@/lib/utils";

// The bookmark ribbon: accent tape tucked under the page edge, notched tail
export default function PlaceRibbon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 32" aria-hidden="true" className={cn("overflow-visible drop-shadow-[0_3px_3px_rgb(0_0_0/0.28)]", className)}>
      <path d="M1 0h14a1 1 0 0 1 1 1v30l-8-6.2L0 31V1a1 1 0 0 1 1-1Z" className="fill-accent" />
      <path d="M0 0h16v4H0z" className="fill-foreground/20" />
      <path d="M4 4v20.6" className="stroke-background/40" strokeWidth="1" />
    </svg>
  );
}
