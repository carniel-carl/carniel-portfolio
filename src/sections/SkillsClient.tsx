"use client";

import { slideUpVariant } from "@/components/animations/general";
import { staggerContainer } from "@/components/animations/portfolio-page";
import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { type IconType } from "react-icons";
import { getIcon } from "@/lib/icon-map";

interface SkillData {
  id: string;
  title: string;
  iconName: string;
}

interface SkillsClientProps {
  skills: SkillData[];
}

const SkillsClient = ({ skills }: SkillsClientProps) => {
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      id="skill"
      className="portfolio flex flex-col"
    >
      <motion.h2
        variants={slideUpVariant}
        className="heading-style after:content-['Acquired_skills'] font-nunito after:font-montserrat md:self-center md:mb-20 mb-12"
      >
        Skills
      </motion.h2>
      <motion.div
        variants={staggerContainer}
        className="grid lg:grid-cols-[repeat(auto-fit,minmax(6rem,1fr))] md:grid-cols-[repeat(auto-fit,minmax(5rem,1fr))] grid-cols-[repeat(auto-fit,minmax(5rem,1fr))] md:gap-x-6 gap-x-3 gap-y-8 justify-items-center items-end"
      >
        {skills.map((data) => {
          const Icon = getIcon(data.iconName);
          return (
            <motion.div
              key={data.id}
              variants={slideUpVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.9 }}
            >
              <SkillCard Icon={Icon} title={data.title} />
            </motion.div>
          );
        })}
      </motion.div>
    </motion.section>
  );
};

const SkillCard = ({
  title,
  Icon,
}: {
  title: string;
  Icon: LucideIcon | IconType | null;
}) => {
  return (
    <div className="flex flex-col items-center gap-2 p-[1.2em] lg:w-24 md:w-20 w-20 overflow-hidden rounded-lg text-foreground border-t-0 border-b-2 !border-b-accent bg-background shadow-md">
      {Icon ? <Icon className="md:size-6 size-4 opacity-70" /> : <div className="md:size-6 size-4" />}
      <p className="text-[0.8em] md:text-sm text-center text-wrap leading-tight">
        {title}
      </p>
    </div>
  );
};

export default SkillsClient;
