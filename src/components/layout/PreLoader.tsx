"use client";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import Logo from "@/components/general/Logo";
import SVGIcon from "@/components/general/SVGIcon";
import { cn } from "@/lib/utils";

const CURTAIN = [0.76, 0, 0.24, 1] as const;
const EXPO = [0.16, 1, 0.3, 1] as const;
const NAME = "Carniel";

type Phase = "phone" | "web" | "full" | "exit";

const PHASE_LABEL: Record<Phase, string> = {
  phone: "Designing for mobile",
  web: "and for the web",
  full: "Web & mobile developer",
  exit: "Web & mobile developer",
};

// Rounded-rect window expressed as a clip-path inset, sized from the viewport
const inset = (W: number, H: number, w: number, h: number, r: number) =>
  `inset(${(H - h) / 2}px ${(W - w) / 2}px ${(H - h) / 2}px ${(W - w) / 2}px round ${r}px)`;

// Intro as a device morph that tells the "web & mobile" story:
//  phone  - an accent phone-shaped window holds the monogram
//  web    - it stretches into a wide browser window and the name appears
//  full   - the window floods the screen
//  exit   - the whole panel lifts with a curved trailing edge
const PreLoader = ({
  onReveal,
  onComplete,
}: {
  onReveal: () => void;
  onComplete: () => void;
}) => {
  const lenis = useLenis();
  const count = useMotionValue(0);
  const display = useTransform(count, (v) => String(Math.round(v)).padStart(3, "0"));
  const progress = useTransform(count, [0, 100], [0, 1]);
  const [phase, setPhase] = useState<Phase>("phone");
  const [shapes, setShapes] = useState<Record<"phone" | "web" | "full", string> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useLayoutEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const pw = Math.min(250, W * 0.5);
    const ph = Math.min(pw * 2.05, H * 0.62);
    const ww = Math.min(W * 0.78, 1040);
    const wh = Math.min(ww * 0.6, H * 0.58);
    setShapes({
      phone: inset(W, H, pw, ph, 38),
      web: inset(W, H, ww, wh, 18),
      full: inset(W, H, W, H, 0),
    });
  }, []);

  useEffect(() => {
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    return () => {
      lenis?.start();
      document.documentElement.style.overflow = "";
    };
  }, [lenis]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const controls = animate(count, 100, { duration: 3, ease: [0.45, 0, 0.2, 1] });
    const t = timers.current;
    t.push(setTimeout(() => setPhase("web"), 1500));
    t.push(setTimeout(() => setPhase("full"), 3100));
    t.push(
      setTimeout(() => {
        setPhase("exit");
        onReveal();
      }, 4300),
    );
    return () => {
      controls.stop();
      t.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clip = shapes ? (phase === "phone" ? shapes.phone : phase === "web" ? shapes.web : shapes.full) : undefined;

  return (
    <motion.div
      role="status"
      aria-label="Loading"
      className="fixed inset-0 z-[110] bg-foreground text-background"
      initial={{ y: 0 }}
      animate={phase === "exit" ? { y: "-100%" } : { y: 0 }}
      transition={{ duration: 1.2, ease: CURTAIN, delay: 0.2 }}
      onAnimationComplete={() => phase === "exit" && onComplete()}
    >
      {/* Curved trailing edge that follows the panel up */}
      <div
        aria-hidden="true"
        className="absolute left-[-10%] top-[calc(100%-1px)] h-[16vh] w-[120%] rounded-b-[50%] bg-accent"
      />

      {/* SUB: The morphing device window */}
      {shapes && (
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 grid place-items-center bg-accent text-accent-on"
          initial={{ clipPath: shapes.phone, opacity: 0, scale: 0.9 }}
          animate={{ clipPath: clip, opacity: 1, scale: 1 }}
          transition={{
            clipPath: { duration: 1.1, ease: CURTAIN },
            opacity: { duration: 0.6 },
            scale: { duration: 0.9, ease: EXPO },
          }}
        >
          <AnimatePresence mode="wait">
            {phase === "phone" ? (
              <motion.div
                key="mark"
                initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.3 } }}
                transition={{ duration: 0.9, ease: EXPO, delay: 0.3 }}
              >
                <SVGIcon width="4.5rem" height="4.5rem" />
              </motion.div>
            ) : (
              <motion.h2
                key="name"
                className="flex overflow-hidden pb-[0.08em] font-display font-bold leading-[0.85] tracking-[-0.04em]"
                animate={{ fontSize: phase === "web" ? "min(12vw, 9.5rem)" : "min(20vw, 17rem)" }}
                initial={{ fontSize: "min(12vw, 9.5rem)" }}
                transition={{ duration: 1.1, ease: CURTAIN }}
              >
                {NAME.split("").map((ch, i) => (
                  <motion.span
                    key={ch + i}
                    className="inline-block"
                    initial={{ y: "110%" }}
                    animate={{ y: phase === "exit" ? "-110%" : "0%" }}
                    transition={{
                      duration: phase === "exit" ? 0.6 : 0.9,
                      ease: phase === "exit" ? CURTAIN : EXPO,
                      delay: i * (phase === "exit" ? 0.03 : 0.05),
                    }}
                  >
                    {ch}
                  </motion.span>
                ))}
              </motion.h2>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <div
        className={cn(
          "pointer-events-none relative mx-auto flex h-full max-w-[1400px] flex-col justify-between px-4 py-6 transition-colors duration-700 md:px-8 md:py-8",
          phase === "full" || phase === "exit" ? "text-accent-on" : "text-background",
        )}
      >
        <div className="flex items-center justify-between text-sm opacity-70">
          <SVGIcon width="1.75rem" height="1.75rem" />
          <span>Portfolio</span>
        </div>

        <div>
          <div className="flex items-end justify-between gap-6">
            <div className="h-6 overflow-hidden md:h-7">
              <AnimatePresence mode="wait">
                <motion.p
                  key={PHASE_LABEL[phase]}
                  initial={{ y: "100%" }}
                  animate={{ y: "0%" }}
                  exit={{ y: "-100%" }}
                  transition={{ duration: 0.5, ease: EXPO }}
                  className="text-base opacity-75 md:text-lg"
                >
                  {PHASE_LABEL[phase]}
                </motion.p>
              </AnimatePresence>
            </div>
            <motion.span className="font-mono text-5xl tabular-nums tracking-tight md:text-7xl">
              {display}
            </motion.span>
          </div>
          <div className="mt-5 h-px w-full bg-current/15 opacity-30">
            <motion.div
              className="h-full origin-left bg-current"
              style={{ scaleX: progress }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PagePreLoader = ({ isCompact }: { isCompact?: boolean }) => {
  return (
    <>
      <motion.div
        className={cn(
          "flex flex-col items-center justify-center bg-background",
          isCompact && "h-full w-full min-h-[50dvh]",
          !isCompact && "fixed inset-0 z-50",
        )}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.3 } }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex items-center gap-4">
            <Logo className="scale-125 md:scale-150" size="2rem" />
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Carniel
            </h1>
          </div>
        </motion.div>

        <motion.div
          className="mt-8 h-1 w-24 overflow-hidden rounded-full bg-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            className="h-full w-full rounded-full bg-accent"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              repeat: Infinity,
              duration: 1.2,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </motion.div>
    </>
  );
};

export default PreLoader;
export { PagePreLoader };
