"use client";
import {
  staggerContainer,
  slideUpVariant,
} from "@/components/animations/portfolio-page";
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
        className="grid lg:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] md:grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] grid-cols-[repeat(auto-fit,minmax(5rem,1fr))] gap-x-6 gap-y-8 justify-items-center"
      >
        {skillsData.map((data) => (
          <motion.div
            key={data.title}
            variants={slideUpVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.9 }}
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
    <article className="flex flex-col items-center gap-2 p-[1.2em] lg:w-40 md:w-32 w-24  rounded-lg text-foreground border-b-4 border-accent bg-background shadow-md">
      <Icon className="md:size-16 size-10" />
      <p className="leading-4 text-[0.8em] md:text-base text-center">{title}</p>
    </article>
  );
};

export default Skills;
