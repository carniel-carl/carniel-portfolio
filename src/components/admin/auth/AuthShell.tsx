import SVGIcon from "@/components/general/SVGIcon";
import ThemeSwitch from "@/components/general/ThemeSwitcher";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/** Shared frame for the sign-in and connector consent screens. */
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-[100dvh] flex-col overflow-hidden bg-background">
      {/* One soft accent glow behind the form, as on the public site */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[60%] -z-10 h-[34rem] w-[min(64rem,160vw)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,hsl(var(--accent)/0.14),transparent)]"
      />

      <header className="flex items-center justify-between gap-4 px-5 pt-5 sm:px-10 sm:pt-7">
        <span className="flex items-center gap-2.5 text-foreground">
          <span className="text-accent">
            <SVGIcon width="2rem" height="2rem" />
          </span>
          <span className="text-[17px] font-semibold tracking-tight">Carniel</span>
        </span>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeSwitch />
          {/* Phones get the disc alone so the switch and the exit share one row */}
          <Link
            href="/"
            className="group inline-flex h-11 items-center gap-2.5 rounded-full border border-foreground/10 p-1.5 text-sm font-medium text-foreground transition-colors hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:pl-4"
          >
            <span className="sr-only sm:not-sr-only">Back to the site</span>
            <span className="grid size-8 place-items-center rounded-full bg-foreground text-background">
              <ArrowUpRight className="size-4 transition-transform duration-300 ease-expo group-hover:-translate-y-px group-hover:translate-x-px" />
            </span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-5 pb-16 pt-12 text-center sm:px-8">
        {children}
      </main>
    </div>
  );
}

/** The owner's portrait, small, so the door reads as Carniel's. */
export function AuthPortrait({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative block size-16 shrink-0 overflow-hidden rounded-full bg-card ring-2 ring-accent ring-offset-4 ring-offset-background",
        className,
      )}
    >
      <Image
        src="/images/profile-pic.jpg"
        alt="Chimezie Carniel"
        fill
        sizes="64px"
        priority
        className="object-cover object-[50%_22%] grayscale"
      />
    </span>
  );
}
