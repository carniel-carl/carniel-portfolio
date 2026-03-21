import { getCachedSkills } from "@/lib/actions/skills";
import SkillsClient from "@/components/admin/SkillsClient";

export default async function SkillsPage() {
  const skills = await getCachedSkills();
  return <SkillsClient skills={JSON.parse(JSON.stringify(skills))} />;
}
