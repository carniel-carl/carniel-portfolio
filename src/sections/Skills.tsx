"use client";
import { slideUpVariant } from "@/components/animations/general";
import { staggerContainer } from "@/components/animations/portfolio-page";
import { skillsData } from "@/data/skills-data";
import { motion } from "framer-motion";
import { LucideProps } from "lucide-react";
import { IconType } from "react-icons";

const Skills = () => {
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
        className="grid lg:grid-cols-[repeat(auto-fit,minmax(6rem,1fr))] md:grid-cols-[repeat(auto-fit,minmax(5rem,1fr))] grid-cols-[repeat(auto-fit,minmax(5rem,1fr))] md:gap-x-6  gap-x-3 gap-y-8 justify-items-center items-end"
      >
        {skillsData.map((data) => (
          <motion.div
            key={data.title}
            variants={slideUpVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.9 }}
          >
            <SkillCard Icon={data.icon} title={data.title} />
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
};

const SkillCard = ({
  title,
  Icon,
}: {
  title: string;
  Icon: React.FC<LucideProps> | IconType;
}) => {
  return (
    <div className="flex flex-col items-center gap-2 p-[1.2em] lg:w-24 md:w-20 w-20 overflow-hidden rounded-lg text-foreground border-t-0 border-b-2 !border-b-accent bg-background shadow-md">
      <Icon className="md:size-6 size-4 opacity-70" />
      <p className="text-[0.8em] md:text-sm text-center text-wrap leading-tight">
        {title}
      </p>
    </div>
  );
};

export default Skills;
