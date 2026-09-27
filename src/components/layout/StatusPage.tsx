import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Logo from "@/components/general/Logo";
import SVGIcon from "@/components/general/SVGIcon";

type StatusPageProps = {
  code: string;
  eyebrow: string;
  title: string;
  description: ReactNode;
  actions: ReactNode;
  // Pages rendered outside the public layout draw their own logo + grain
  standalone?: boolean;
};

// Shared layout for the 404 and error pages. No hooks, so it works in both
// Server Components (not-found) and Client Components (error boundaries).
const StatusPage = ({
  code,
  eyebrow,
  title,
  description,
  actions,
  standalone,
}: StatusPageProps) => (
  <section
    className={cn(
      "relative isolate flex flex-col overflow-hidden bg-background px-4 md:px-8",
      // Inside the public layout the fixed header takes the top 3.5rem
      standalone ? "min-h-[100dvh]" : "min-h-[calc(100dvh-3.5rem)]",
    )}
  >
    {standalone && (
      <>
        <div aria-hidden="true" className="grain" />
        <div className="mx-auto flex h-20 w-full max-w-[1400px] items-center">
          <Logo />
        </div>
      </>
    )}

    {/* Oversized outlined code + drifting monogram, purely decorative */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-[0.12em] right-[-0.04em] -z-10 select-none font-display text-[clamp(12rem,42vw,34rem)] font-semibold leading-none tracking-[-0.06em] text-transparent [-webkit-text-stroke:1px_hsl(var(--foreground)/0.14)] [font-stretch:75%]"
    >
      {code}
    </div>
    <div
      aria-hidden="true"
      className="route-loader__mark pointer-events-none -left-[12vw] top-[8vh] -z-10"
    >
      <SVGIcon width="100%" height="100%" />
    </div>

    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center gap-8 py-16">
      <p className="flex items-center gap-3 font-mono text-sm uppercase tracking-[0.14em] text-foreground/60">
        <span className="size-2 rounded-full bg-accent" />
        {eyebrow}
      </p>
      <h1 className="max-w-[14ch] text-balance font-display text-[clamp(3.25rem,9vw,8rem)] font-semibold leading-[0.9] tracking-[-0.045em] [font-stretch:75%]">
        {title}
      </h1>
      <p className="max-w-[44ch] text-pretty text-lg leading-relaxed text-foreground/70 md:text-xl">
        {description}
      </p>
      <div className="flex flex-wrap gap-3">{actions}</div>
    </div>
  </section>
);

export default StatusPage;
