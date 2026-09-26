"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import PillLink from "@/components/motion/PillLink";
import Magnetic from "@/components/motion/Magnetic";
import routes from "@/lib/routes";
import { trackEvent } from "@/lib/mixpanel";
import KineticName from "@/sections/home/KineticName";
import { useIntroReady } from "@/components/layout/Intro";

const EASE = [0.16, 1, 0.3, 1] as const;
const NAME = "Carniel";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (d: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: EASE, delay: d },
  }),
};

const Hero = () => {
  const ready = useIntroReady();
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Leaving the hero: name sinks, portrait drifts up, copy dissolves
  const nameY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const portraitY = useTransform(scrollYProgress, [0, 1], ["0%", "-22%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);

  const state: "hidden" | "visible" = reduce || ready ? "visible" : "hidden";

  return (
    <section
      ref={ref}
      id="top"
      className="relative isolate min-h-[calc(100dvh-3.5rem)] overflow-hidden"
    >
      <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-[1400px] flex-col px-4 pb-4 pt-8 md:px-8 md:pb-6">
        <div className="relative grid grid-cols-1 content-start gap-10 md:flex-1 md:grid-cols-12 md:content-stretch md:gap-8">
          {/* SUB: Intro copy */}
          <motion.div
            style={reduce ? undefined : { opacity: copyOpacity }}
            className="relative z-[2] flex flex-col gap-7 md:col-span-6 md:pt-10 lg:col-span-5"
          >
            <motion.p
              custom={0.55}
              variants={fadeUp}
              initial={reduce ? false : "hidden"}
              animate={state}
              className="text-base text-foreground/70 md:text-lg"
            >
              Hello, I&apos;m Chimezie. Web &amp; mobile developer.
            </motion.p>

            <motion.p
              custom={0.7}
              variants={fadeUp}
              initial={reduce ? false : "hidden"}
              animate={state}
              className="max-w-[30ch] text-balance font-display text-2xl font-medium leading-[1.15] tracking-[-0.02em] md:text-[2rem]"
            >
              I build fast, accessible web and mobile apps with React and React
              Native that look as good as they work.
            </motion.p>

            <motion.div
              custom={0.85}
              variants={fadeUp}
              initial={reduce ? false : "hidden"}
              animate={state}
              className="flex flex-wrap items-center gap-3"
            >
              <Magnetic strength={0.25}>
                <PillLink
                  href={routes.public.portfolio}
                  icon={<ArrowUpRight />}
                  onClick={() =>
                    trackEvent("Home CTA Clicked", { cta: "view_work" })
                  }
                >
                  View work
                </PillLink>
              </Magnetic>
              <PillLink
                href={routes.public.blog}
                variant="ghost"
                icon={<ArrowRight />}
              >
                Read the blog
              </PillLink>
            </motion.div>
          </motion.div>

          {/* SUB: Portrait, clip-revealed from the bottom edge */}
          <motion.div
            style={reduce ? undefined : { y: portraitY }}
            className="relative z-[1] w-[56%] justify-self-end md:col-span-5 md:col-start-8 md:w-full lg:col-span-4 lg:col-start-9"
          >
            <motion.div
              initial={reduce ? false : { clipPath: "inset(100% 0% 0% 0% round 1.25rem)" }}
              animate={
                state === "visible"
                  ? { clipPath: "inset(0% 0% 0% 0% round 1.25rem)" }
                  : undefined
              }
              transition={{ duration: 1.4, ease: [0.76, 0, 0.24, 1], delay: 0.25 }}
              className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.25rem] bg-surface"
            >
              <motion.div
                style={reduce ? undefined : { scale: imageScale }}
                className="absolute inset-0"
              >
                <motion.div
                  initial={reduce ? false : { scale: 1.35 }}
                  animate={state === "visible" ? { scale: 1 } : undefined}
                  transition={{ duration: 1.8, ease: EASE, delay: 0.25 }}
                  className="absolute inset-0"
                >
                  <Image
                    src="/images/profile-pic.jpg"
                    alt="Portrait of Chimezie Nmugha"
                    fill
                    priority
                    sizes="(max-width: 768px) 62vw, 30vw"
                    className="object-cover object-[50%_30%]"
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* SUB: Oversized name; overlaps the portrait's lower edge */}
        <KineticName
          name={NAME}
          state={state}
          style={{ y: nameY }}
          className="relative z-[3] -mt-[15vw] pb-[0.06em] pt-[0.12em] font-display text-[23vw] font-bold leading-[0.8] tracking-[-0.035em] md:-mt-[13.5vw] md:text-[29vw] 2xl:text-[min(29vw,28rem)]"
        />
      </div>
    </section>
  );
};

export default Hero;
