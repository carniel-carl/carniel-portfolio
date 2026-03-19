import prisma from "@/lib/prisma";
import SkillsClient from "./SkillsClient";

const Skills = async () => {
  const skills = await prisma.skill.findMany({ orderBy: { order: "asc" } });
  return (
    <SkillsClient
      skills={skills.map((s) => ({
        id: s.id,
        title: s.title,
        iconName: s.iconName,
      }))}
    />
  );
};

export default Skills;
