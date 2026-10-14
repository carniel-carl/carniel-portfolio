"use client";

import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { useId, useState, type KeyboardEvent, type PointerEvent } from "react";

type Day = { date: string; count: number };

// Drawn in a stretched 1000 x 100 box; the stroke stays 2.5px via non-scaling-stroke
const W = 1000;
const H = 100;

/** Monotone cubic (Fritsch-Carlson): smooth, but never dips below a quiet day. */
function monotonePath(pts: [number, number][]) {
  const n = pts.length;
  if (n < 2) return "";
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    m.push((pts[i + 1][1] - pts[i][1]) / dx[i]);
  }
  const t = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    t.push(
      m[i - 1] * m[i] <= 0
        ? 0
        : (3 * (dx[i - 1] + dx[i])) /
            ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]),
    );
  }
  t.push(m[n - 2]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${pts[i][0] + h},${pts[i][1] + t[i] * h} ${pts[i + 1][0] - h},${pts[i + 1][1] - t[i + 1] * h} ${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}

/**
 * The band's floor: one accent curve of daily visits. Draws in once from the
 * left (admin.css) and answers the pointer, or the arrow keys, with that day's count.
 */
export default function VisitsCurve({ days, className }: { days: Day[]; className?: string }) {
  const gradientId = `visits-${useId().replace(/[^\w-]/g, "")}`;
  const [hover, setHover] = useState<number | null>(null);
  if (days.length < 2) return null;

  const max = Math.max(1, ...days.map((d) => d.count));
  const x = (i: number) => (i / (days.length - 1)) * W;
  const y = (count: number) => H - 2 - (count / max) * (H - 14);
  const line = monotonePath(days.map((d, i) => [x(i), y(d.count)]));
  const last = days.length - 1;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - rect.left) / rect.width) * last);
    setHover(Math.min(last, Math.max(0, i)));
  };

  const point = (i: number) => ({
    left: `${(x(i) / W) * 100}%`,
    top: `${(y(days[i].count) / H) * 100}%`,
  });

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (step) setHover((h) => Math.min(last, Math.max(0, (h ?? last) + step)));
    else if (e.key === "Home") setHover(0);
    else if (e.key === "End") setHover(last);
    else return;
    e.preventDefault();
  };

  const active = hover === null ? null : days[hover];
  const edge = hover === null ? 0 : hover / last;
  const label =
    active &&
    `${dayjs(active.date).format("ddd D MMM")}${hover === last ? " (so far)" : ""} · ${active.count.toLocaleString()} ${active.count === 1 ? "visit" : "visits"}`;

  return (
    <div
      role="group"
      tabIndex={0}
      aria-label="Site visits per day, last 30 days. Use the left and right arrow keys to read each day."
      onPointerMove={onMove}
      onPointerLeave={() => setHover(null)}
      onKeyDown={onKey}
      onFocus={() => setHover((h) => h ?? last)}
      onBlur={() => setHover(null)}
      className={cn(
        "rounded-lg text-accent-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-[hsl(var(--brand-surface))]",
        className,
      )}
    >
      <p aria-live="polite" className="sr-only">
        {label}
      </p>
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="dash-curve absolute inset-0 size-full overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L${W},${H} L0,${H} Z`} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Today: an HTML dot so the stretched box can't squash it */}
      <span
        aria-hidden="true"
        className="dash-curve-dot absolute size-2.5 rounded-full bg-current ring-4 ring-[hsl(var(--brand-surface))]"
        style={{ ...point(last), transform: "translate(-50%, -50%)" }}
      />

      {active && hover !== null && (
        <span aria-hidden="true">
          <span
            className="absolute inset-y-0 w-px bg-current opacity-40"
            style={{ left: point(hover).left }}
          />
          <span
            className="absolute size-2.5 rounded-full bg-current ring-4 ring-[hsl(var(--brand-surface))]"
            style={{ ...point(hover), transform: "translate(-50%, -50%)" }}
          />
          <span
            className="tnum absolute whitespace-nowrap rounded-full bg-card px-3 py-1.5 text-xs font-medium text-card-foreground shadow-[var(--shadow-surface)]"
            style={{
              left: point(hover).left,
              top: point(hover).top,
              transform: `translate(${edge < 0.12 ? "0" : edge > 0.88 ? "-100%" : "-50%"}, calc(-100% - 14px))`,
            }}
          >
            {label}
          </span>
        </span>
      )}
    </div>
  );
}
