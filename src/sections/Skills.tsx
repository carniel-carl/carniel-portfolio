"use cache";
import { cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import SkillsClient from "@/sections/SkillsClient";

const Skills = async () => {
  cacheTag(CACHE_TAGS.skills);
  cacheLife("max");
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
