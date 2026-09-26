"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useRef } from "react";
import { ArrowDownRight } from "lucide-react";
import PillLink from "@/components/motion/PillLink";
import routes from "@/lib/routes";

const TEXT =
  "I found code while building a website for my art business. Since then I design and engineer interfaces for the web and for mobile, where creativity meets function and every detail earns its place.";

const Word = ({
  children,
  progress,
  range,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}) => {
  const reduce = useReducedMotion();
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <motion.span style={{ opacity: reduce ? 1 : opacity }} className="inline-block">
      {children}
      {" "}
    </motion.span>
  );
};

// Words ink in one by one as the paragraph travels up the viewport, so the
// statement is read at the pace of the scroll.
const Statement = () => {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.5"],
  });
  const words = TEXT.split(" ");

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-24 md:px-8 md:py-40">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
        <p
          ref={ref}
          className="font-display text-[2rem] font-medium leading-[1.12] tracking-[-0.025em] md:col-span-10 md:col-start-2 md:text-5xl lg:col-span-9 lg:col-start-3 lg:text-[3.75rem]"
        >
          {words.map((w, i) => (
            <Word
              key={w + i}
              progress={scrollYProgress}
              range={[i / words.length, (i + 1) / words.length]}
            >
              {w}
            </Word>
          ))}
        </p>
        <div className="md:col-span-10 md:col-start-2 lg:col-span-9 lg:col-start-3">
          <PillLink
            href={`${routes.public.portfolio}#about`}
            variant="ghost"
            icon={<ArrowDownRight />}
          >
            More about me
          </PillLink>
        </div>
      </div>
    </section>
  );
};

export default Statement;
