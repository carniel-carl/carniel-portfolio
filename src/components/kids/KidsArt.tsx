// Hand-drawn pieces for the kids prompt: one stroke weight, round caps,
// foreground outlines over the --kid-* fills, so they hold up in both themes.
import { cn } from "@/lib/utils";

const stroke = {
  stroke: "currentColor",
  strokeWidth: 2.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const fill = (token: string) => `hsl(var(--kid-${token}))`;

export function Rocket({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("text-foreground", className)}>
      {/* Flame */}
      <path d="M26 47c0 6 3 10 6 13 3-3 6-7 6-13" fill={fill("coral")} {...stroke} />
      <path d="M29.5 48c0 3.5 1 6 2.5 7.5 1.5-1.5 2.5-4 2.5-7.5" fill={fill("sun")} stroke="none" />
      {/* Fins */}
      <path d="M22 36l-8 9 1 5 10-5" fill={fill("sky")} {...stroke} />
      <path d="M42 36l8 9-1 5-10-5" fill={fill("sky")} {...stroke} />
      {/* Body */}
      <path d="M32 4c-9 7-12 18-11 31l2 12h18l2-12c1-13-2-24-11-31z" fill="hsl(var(--background))" {...stroke} />
      <path d="M24.5 13.5h15" {...stroke} />
      {/* Window */}
      <circle cx="32" cy="26" r="5.5" fill={fill("sky")} {...stroke} />
      <path d="M29.5 24.5a3 3 0 0 1 2.5-1.5" stroke="hsl(var(--background))" strokeWidth={2} strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Mug({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("text-foreground", className)}>
      {/* Steam */}
      <path d="M24 6c-3 3 3 5 0 9" fill="none" {...stroke} />
      <path d="M32 3c-3 3 3 6 0 10" fill="none" {...stroke} />
      <path d="M40 6c-3 3 3 5 0 9" fill="none" {...stroke} />
      {/* Handle */}
      <path d="M47 28h4a7 7 0 0 1 0 14h-5" fill="none" {...stroke} />
      {/* Cup */}
      <path d="M13 20h35v20c0 9-7 16-16 16h-3c-9 0-16-7-16-16z" fill={fill("sky")} {...stroke} />
      <path d="M13 20h35" {...stroke} />
      {/* Heart */}
      <path
        d="M30.5 43s-7-4.3-7-9a3.8 3.8 0 0 1 7-2 3.8 3.8 0 0 1 7 2c0 4.7-7 9-7 9z"
        fill={fill("coral")}
        {...stroke}
        strokeWidth={2}
      />
      <path d="M8 58h48" {...stroke} />
    </svg>
  );
}

export function Shield({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("text-foreground", className)}>
      <path d="M32 5l21 8v16c0 14-9 25-21 30C20 54 11 43 11 29V13z" fill={fill("leaf")} {...stroke} />
      <path d="M22 32l7 7 13-14" fill="none" {...stroke} strokeWidth={3.5} />
    </svg>
  );
}

// Playground confetti that floats around the card's edges. Each piece drifts
// on its own delay; the global reduced-motion rule stills them.
const PIECES = [
  { className: "-left-5 top-10 size-12 sm:-left-8", tilt: "14deg", delay: "0s", shape: "star", color: "sun" },
  { className: "-right-4 -top-5 size-11 sm:-right-7", tilt: "-10deg", delay: "-1.4s", shape: "circle", color: "coral" },
  { className: "-right-5 bottom-16 size-10 sm:-right-8", tilt: "18deg", delay: "-2.2s", shape: "triangle", color: "leaf" },
  { className: "-bottom-5 left-12 size-11", tilt: "-14deg", delay: "-0.7s", shape: "squiggle", color: "sky" },
  { className: "-left-3 bottom-24 hidden size-7 sm:block", tilt: "10deg", delay: "-3s", shape: "circle", color: "grape" },
] as const;

function Piece({ shape, color }: { shape: (typeof PIECES)[number]["shape"]; color: string }) {
  const f = fill(color);
  switch (shape) {
    case "star":
      return (
        <path
          d="M24 4l5.6 11.8 12.9 1.6-9.5 8.9 2.5 12.8L24 32.8l-11.5 6.3L15 26.3l-9.5-8.9 12.9-1.6z"
          fill={f}
          {...stroke}
        />
      );
    case "circle":
      return <circle cx="24" cy="24" r="17" fill={f} {...stroke} />;
    case "triangle":
      return <path d="M24 6l19 33H5z" fill={f} {...stroke} />;
    case "squiggle":
      return (
        <path
          d="M4 30c5-12 9-12 13 0s8 12 13 0 9-12 14 0"
          fill="none"
          stroke={f}
          strokeWidth={6}
          strokeLinecap="round"
        />
      );
  }
}

export function Confetti() {
  return (
    <>
      {PIECES.map((p) => (
        <svg
          key={p.className}
          viewBox="0 0 48 48"
          aria-hidden="true"
          className={cn("pointer-events-none absolute text-foreground", p.className)}
          style={
            {
              "--kid-tilt": p.tilt,
              animation: `kid-float 5.5s ease-in-out ${p.delay} infinite`,
            } as React.CSSProperties
          }
        >
          <Piece shape={p.shape} color={p.color} />
        </svg>
      ))}
    </>
  );
}
