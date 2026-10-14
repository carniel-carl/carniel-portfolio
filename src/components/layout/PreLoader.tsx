"use client";
import {
  AnimatePresence,
  animate,
  motion,
  useAnimationFrame,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import SVGIcon from "@/components/general/SVGIcon";

const CURTAIN = [0.76, 0, 0.24, 1] as const;
const EXPO = [0.16, 1, 0.3, 1] as const;
const NAME = "Carniel";
const PORTRAIT = "/images/profile-pic.jpg";
const PORTRAIT_RATIO = 2048 / 1638; // height / width

const LABELS = ["Designing for mobile", "and for the web", "Web & mobile developer"];

// Wave-topped fill used as a mask. The image is twice the element's height:
// transparent above the wave, opaque below. Sliding it up raises the level,
// sliding it sideways makes the surface move.
const WAVE = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 1000" preserveAspectRatio="none"><path d="M0 500 Q30 478 60 500 T120 500 T180 500 T240 500 V1000 H0 Z" fill="#000"/></svg>',
)}")`;

// The name, one masked span per letter so the letters rise in turn. With
// `portrait`, every letter is a window onto ONE shared portrait: each gets the
// slice of the image that sits behind it, measured from its rest position.
const Word = ({ portrait = false }: { portrait?: boolean }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [slices, setSlices] = useState<{ size: string; pos: string }[]>([]);

  useLayoutEffect(() => {
    if (!portrait) return;
    const measure = () => {
      const word = ref.current;
      if (!word) return;
      const W = word.offsetWidth;
      const H = word.offsetHeight;
      const imgH = W * PORTRAIT_RATIO;
      // Face sits about a third of the way down the photo
      const top = imgH * 0.34 - H / 2;
      setSlices(
        Array.from(word.querySelectorAll<HTMLElement>("[data-cell]")).map((cell) => ({
          size: `${W}px ${imgH}px`,
          pos: `${-cell.offsetLeft}px ${-top}px`,
        })),
      );
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [portrait]);

  return (
    <span ref={ref} className="relative flex">
      {NAME.split("").map((ch, i) => (
        <span key={ch + i} data-cell className="inline-block overflow-hidden pb-[0.04em]">
          <motion.span
            className={portrait ? "inline-block bg-no-repeat bg-clip-text text-transparent" : "inline-block"}
            style={
              portrait
                ? {
                    backgroundImage: `url(${PORTRAIT})`,
                    backgroundSize: slices[i]?.size ?? "cover",
                    backgroundPosition: slices[i]?.pos ?? "center",
                  }
                : undefined
            }
            initial={{ y: "105%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 1.1, ease: EXPO, delay: 0.15 + i * 0.06 }}
          >
            {ch}
          </motion.span>
        </span>
      ))}
    </span>
  );
};

// One full copy of the loader. Two are stacked and clipped to the top and
// bottom halves, so on exit the screen can tear open along the waterline.
const Sheet = ({
  label,
  display,
  progress,
  liquidRef,
}: {
  label: string;
  display: MotionValue<string>;
  progress: MotionValue<number>;
  liquidRef: (el: HTMLSpanElement | null) => void;
}) => (
  <div className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-between px-4 py-6 md:px-8 md:py-8">
    <div className="flex items-center justify-between text-sm opacity-70">
      <SVGIcon width="1.75rem" height="1.75rem" />
      <span>Portfolio</span>
    </div>

    {/* The name: cut out of the portrait, filling with the accent */}
    <h2
      aria-label={NAME}
      className="relative self-center font-display text-[min(22vw,19rem)] font-black leading-[0.86] tracking-[-0.04em]"
    >
      <Word portrait />
      <span
        ref={liquidRef}
        aria-hidden="true"
        className="absolute inset-0 text-accent"
        style={{
          maskImage: WAVE,
          WebkitMaskImage: WAVE,
          maskSize: "min(16vw, 15rem) 200%",
          WebkitMaskSize: "min(16vw, 15rem) 200%",
          maskRepeat: "repeat-x",
          WebkitMaskRepeat: "repeat-x",
          maskPosition: "0px 0%",
          WebkitMaskPosition: "0px 0%",
        }}
      >
        <Word />
      </span>
    </h2>

    <div>
      <div className="flex items-end justify-between gap-6">
        <div className="h-6 overflow-hidden md:h-7">
          <AnimatePresence mode="wait">
            <motion.p
              key={label}
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "-100%" }}
              transition={{ duration: 0.5, ease: EXPO }}
              className="text-base opacity-75 md:text-lg"
            >
              {label}
            </motion.p>
          </AnimatePresence>
        </div>
        <motion.span className="font-mono text-5xl tabular-nums tracking-tight md:text-7xl">
          {display}
        </motion.span>
      </div>
      <div className="mt-5 h-px w-full bg-current/15 opacity-30">
        <motion.div className="h-full origin-left bg-current" style={{ scaleX: progress }} />
      </div>
    </div>
  </div>
);

// Intro: the name in the portrait, filling with colour as it loads.
//  - letters rise, each a window onto the black-and-white portrait
//  - the accent rises inside them like liquid, its surface moving, as the
//    counter climbs to 100
//  - the screen tears open along the middle and the page is underneath
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
  const [phase, setPhase] = useState(0);
  const [exit, setExit] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const liquids = useRef<HTMLSpanElement[]>([]);
  const drift = useRef(0);

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
    // Starts a beat late so the letters are up before they begin to fill
    const controls = animate(count, 100, { duration: 3, delay: 0.6, ease: [0.65, 0, 0.35, 1] });
    const t = timers.current;
    t.push(setTimeout(() => setPhase(1), 1700));
    t.push(setTimeout(() => setPhase(2), 3000));
    t.push(
      setTimeout(() => {
        setExit(true);
        onReveal();
      }, 4000),
    );
    return () => {
      controls.stop();
      t.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Liquid level follows the counter; the surface drifts sideways
  useAnimationFrame((_, delta) => {
    drift.current = (drift.current + delta * 0.08) % 10000;
    // 0% shows the empty top half of the mask, 100% the full bottom half.
    // The fill waits for the first stretch of the count so the portrait in
    // the letters is seen first, and overshoots so the crest clears the tops.
    const level = Math.min(100, Math.max(0, (count.get() - 22) / 78) * 106);
    const pos = `${drift.current}px ${level}%`;
    for (const el of liquids.current) {
      if (!el) continue;
      el.style.maskPosition = pos;
      el.style.setProperty("-webkit-mask-position", pos);
    }
  });

  const halves = [
    { clip: "inset(0% 0% 50% 0%)", to: "-100%" },
    { clip: "inset(50% 0% 0% 0%)", to: "100%" },
  ];

  return (
    <div role="status" aria-label="Loading" className="fixed inset-0 z-[110]">
      {halves.map((h, i) => (
        <motion.div
          key={h.to}
          aria-hidden={i === 1 ? "true" : undefined}
          className="absolute inset-0 bg-foreground text-background"
          style={{ clipPath: h.clip }}
          initial={{ y: "0%" }}
          animate={{ y: exit ? h.to : "0%" }}
          transition={{ duration: 1.15, ease: CURTAIN, delay: 0.1 }}
          onAnimationComplete={() => exit && i === 0 && onComplete()}
        >
          <Sheet
            label={LABELS[phase]}
            display={display}
            progress={progress}
            liquidRef={(el) => {
              if (el) liquids.current[i] = el;
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default PreLoader;
