import { getCachedAboutForAdmin } from "@/lib/actions/about";
import AboutClient from "@/components/admin/AboutClient";

export default async function AboutPage() {
  const about = await getCachedAboutForAdmin();
  return <AboutClient about={about} />;
}
