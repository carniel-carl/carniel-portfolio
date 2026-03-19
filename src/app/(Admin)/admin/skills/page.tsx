export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import SkillsClient from "@/components/admin/SkillsClient";

export default async function SkillsPage() {
  const skills = await prisma.skill.findMany({ orderBy: { order: "asc" } });

  return <SkillsClient skills={JSON.parse(JSON.stringify(skills))} />;
}
