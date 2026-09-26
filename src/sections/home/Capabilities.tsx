"use client";

import { type PointerEvent, type ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { Gauge, Layers, MonitorSmartphone, Smartphone } from "lucide-react";
import SplitText from "@/components/motion/SplitText";
import { cn } from "@/lib/utils";

type Capability = {
  title: string;
  body: string;
  tools: string[];
  icon: ReactNode;
  span: string;
  accent?: boolean;
};

const CAPABILITIES: Capability[] = [
  {
    title: "Web applications",
    body: "Production apps with React and Next.js, from marketing sites to full product dashboards.",
    tools: ["Next.js", "React", "TypeScript"],
    icon: <MonitorSmartphone />,
    span: "md:col-span-7",
  },
  {
    title: "Mobile apps",
    body: "Cross-platform iOS and Android apps with React Native that feel at home on both.",
    tools: ["React Native", "iOS", "Android"],
    icon: <Smartphone />,
    span: "md:col-span-5",
    accent: true,
  },
  {
    title: "Interfaces & design systems",
    body: "Reusable components and considered motion that keep a product consistent as it grows.",
    tools: ["Tailwind CSS", "Component libraries", "Motion"],
    icon: <Layers />,
    span: "md:col-span-5",
  },
  {
    title: "Performance & accessibility",
    body: "Fast loads, smooth interactions and interfaces that work for everyone who uses them.",
    tools: ["Core Web Vitals", "WCAG", "SEO"],
    icon: <Gauge />,
    span: "md:col-span-7",
  },
];

// Soft light that follows the cursor across a card
const Card = ({ item, index }: { item: Capability; index: number }) => {
  const reduce = useReducedMotion();
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const glow = useMotionTemplate`radial-gradient(420px circle at ${mx}px ${my}px, ${
    item.accent ? "hsl(0 0% 100% / 0.22)" : "hsl(var(--foreground) / 0.07)"
  }, transparent 70%)`;

  const onMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  };

  return (
    <motion.article
      onPointerMove={onMove}
      onPointerLeave={() => {
        mx.set(-400);
        my.set(-400);
      }}
      initial={reduce ? false : { opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: (index % 2) * 0.12 }}
      className={cn(
        "group relative flex min-h-[20rem] flex-col justify-between gap-12 overflow-hidden rounded-[1.25rem] p-6 md:min-h-[24rem] md:p-8",
        item.accent
          ? "bg-accent text-accent-on"
          : "border border-foreground/[0.08] bg-surface",
        item.span,
      )}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: glow }}
      />
      <div
        className={cn(
          "relative grid size-14 place-items-center rounded-full transition-transform duration-700 ease-expo group-hover:-rotate-12 group-hover:scale-110 [&_svg]:size-6",
          item.accent ? "bg-accent-on text-accent" : "bg-foreground text-background",
        )}
      >
        {item.icon}
      </div>
      <div className="relative flex flex-col gap-4">
        <h3 className="font-display text-3xl font-semibold leading-[1.02] tracking-[-0.03em] md:text-[2.75rem]">
          {item.title}
        </h3>
        <p
          className={cn(
            "max-w-[42ch] text-base leading-relaxed md:text-lg",
            item.accent ? "text-accent-on/80" : "text-foreground/70",
          )}
        >
          {item.body}
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {item.tools.map((tool) => (
            <li
              key={tool}
              className={cn(
                "rounded-full border px-3 py-1 text-xs md:text-sm",
                item.accent
                  ? "border-accent-on/25"
                  : "border-foreground/15 text-foreground/80",
              )}
            >
              {tool}
            </li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
};

const Capabilities = () => {
  return (
    <section className="mx-auto max-w-[1400px] px-4 pb-24 md:px-8 md:pb-40">
      <SplitText
        as="h2"
        text="What I build"
        className="font-display text-[clamp(3rem,9vw,8.5rem)] font-semibold leading-[0.9] tracking-[-0.04em] [font-stretch:75%]"
      />
      <p className="mt-6 max-w-[48ch] text-lg text-foreground/70 md:text-xl">
        One codebase mindset, two platforms. I ship for the browser and for the
        phone in your pocket.
      </p>
      <div className="mt-12 grid grid-cols-1 gap-4 md:mt-16 md:grid-cols-12 md:gap-5">
        {CAPABILITIES.map((item, i) => (
          <Card key={item.title} item={item} index={i} />
        ))}
      </div>
    </section>
  );
};

export default Capabilities;
