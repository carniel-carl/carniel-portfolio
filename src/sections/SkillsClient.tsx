"use client";

import { motion, useReducedMotion } from "framer-motion";
import SkillIcon, { type SkillIconData } from "@/components/general/SkillIcon";
import SplitText from "@/components/motion/SplitText";

interface SkillData extends SkillIconData {
  id: string;
  title: string;
}

interface SkillsClientProps {
  skills: SkillData[];
}

// Typographic wall: skills set as display type that flows and wraps like a
// sentence, each word rising into place in reading order.
const SkillsClient = ({ skills }: SkillsClientProps) => {
  const reduce = useReducedMotion();

  return (
    <section id="skill" className="portfolio flex flex-col pb-24 md:pb-40">
      <SplitText
        as="h2"
        text="Skills & tools"
        className="font-display text-[clamp(3.25rem,10vw,9rem)] font-semibold leading-[0.88] tracking-[-0.045em] [font-stretch:75%]"
      />

      {skills.length === 0 ? (
        <p className="mt-10 text-foreground/65">Skills will appear here once added.</p>
      ) : (
        <motion.ul
          initial={reduce ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 md:mt-16 md:gap-x-10 md:gap-y-5"
        >
          {skills.map((data) => {
            return (
              <li key={data.id} className="overflow-hidden pb-[0.12em]">
                <motion.div
                  variants={{
                    hidden: { y: "110%" },
                    visible: {
                      y: "0%",
                      transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
                    },
                  }}
                >
                  <SkillWord icon={data} title={data.title} />
                </motion.div>
              </li>
            );
          })}
        </motion.ul>
      )}
    </section>
  );
};

const SkillWord = ({
  title,
  icon,
}: {
  title: string;
  icon: SkillIconData;
}) => {
  return (
    <span className="group inline-flex cursor-default items-center gap-3 md:gap-4">
      <SkillIcon
        icon={icon}
        className="size-6 shrink-0 text-accent-ink transition-transform duration-500 ease-expo group-hover:rotate-[-12deg] group-hover:scale-110 md:size-10"
      />
      <span className="font-display text-3xl font-medium tracking-[-0.03em] text-foreground/85 transition-colors duration-300 group-hover:text-foreground md:text-5xl lg:text-6xl">
        {title}
      </span>
    </span>
  );
};

export default SkillsClient;
