import SVGIcon from "@/components/general/SVGIcon";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Real screenshots of shipped work, split into three drifting columns
const columns = [
  ["greens", "othrika", "trgst", "pouch"],
  ["technoclean", "jollofdiary", "estore"],
  ["zubion", "pouchswap", "todo"],
];

// Seconds per loop; the middle column runs the other way
const durations = [70, 84, 62];

/** Brand panel beside the sign-in form. Motion is CSS only (see admin.css). */
export default function AuthShowcase() {
  return (
    <aside className="band-ink relative m-3 hidden overflow-hidden rounded-2xl bg-[hsl(var(--brand-surface))] lg:block">
      <div
        aria-hidden="true"
        className="absolute -inset-x-24 -bottom-40 -top-40 grid rotate-[-9deg] grid-cols-3 gap-4"
      >
        {columns.map((shots, i) => (
          <div key={i} className="overflow-hidden">
            <div
              className="auth-drift flex flex-col"
              data-reverse={i === 1 || undefined}
              style={{ animationDuration: `${durations[i]}s` }}
            >
              {/* Rendered twice so a -50% translate loops without a seam */}
              {[...shots, ...shots].map((name, j) => (
                <div key={`${name}-${j}`} className="pb-4">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-card shadow-[var(--shadow-surface)] ring-1 ring-black/5">
                    <Image
                      src={`/images/projects/${name}.png`}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 18vw, 1px"
                      // On screen at load; the loop copy reuses the same cached file
                      loading="eager"
                      className="object-cover object-top"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Scrims keep the header and headline readable over the screenshots */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[hsl(var(--brand-surface))] to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[hsl(var(--brand-surface))] from-40% via-[hsl(var(--brand-surface)/0.85)] via-65% to-transparent"
      />

      <div className="relative flex h-full flex-col justify-between p-8 xl:p-10">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-foreground text-accent">
              <SVGIcon width="1.25rem" height="1.25rem" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">Carniel</span>
          </span>
          <Link
            href="/"
            className="group inline-flex items-center gap-1 rounded-full bg-[hsl(var(--brand-surface))]/70 px-3.5 py-1.5 text-sm font-medium ring-1 ring-foreground/10 backdrop-blur transition-colors hover:ring-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View the site
            <ArrowUpRight className="size-3.5 transition-transform duration-300 ease-expo group-hover:-translate-y-px group-hover:translate-x-px" />
          </Link>
        </div>

        <h2 className="max-w-[11ch] pb-1 font-display text-[clamp(3rem,5.2vw,5.25rem)] font-semibold leading-[0.9] tracking-[-0.045em] [font-stretch:75%]">
          <span className="auth-rise block" style={{ animationDelay: "120ms" }}>
            Projects, posts
          </span>
          <span className="auth-rise block" style={{ animationDelay: "220ms" }}>
            and skills,
          </span>
          <span className="auth-rise block text-accent-ink" style={{ animationDelay: "320ms" }}>
            in one place.
          </span>
        </h2>
      </div>
    </aside>
  );
}
