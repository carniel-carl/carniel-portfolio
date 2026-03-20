import { cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import AboutClient from "@/components/admin/AboutClient";

async function getAbout() {
  "use cache";
  cacheTag(CACHE_TAGS.about);
  cacheLife("max");

  let about = await prisma.about.findFirst();
  if (!about) {
    about = await prisma.about.create({
      data: { bio: "", profilePicUrl: "", resumeUrl: "" },
    });
  }

  return JSON.parse(JSON.stringify(about));
}

export default async function AboutPage() {
  const about = await getAbout();
  return <AboutClient about={about} />;
}
