import { getCachedSkills } from "@/lib/actions/skills";
import SkillsClient from "@/sections/SkillsClient";

const Skills = async () => {
  const skills = await getCachedSkills();

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
