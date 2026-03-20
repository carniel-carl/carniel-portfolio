import { cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import SkillsClient from "@/components/admin/SkillsClient";

async function getSkills() {
  "use cache";
  cacheTag(CACHE_TAGS.skills);
  cacheLife("max");

  const skills = await prisma.skill.findMany({ orderBy: { order: "asc" } });
  return JSON.parse(JSON.stringify(skills));
}

export default async function SkillsPage() {
  const skills = await getSkills();
  return <SkillsClient skills={skills} />;
}
