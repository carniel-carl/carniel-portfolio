export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import AboutClient from "@/components/admin/AboutClient";

export default async function AboutPage() {
  let about = await prisma.about.findFirst();
  if (!about) {
    about = await prisma.about.create({
      data: { bio: "", profilePicUrl: "", resumeUrl: "" },
    });
  }

  return <AboutClient about={JSON.parse(JSON.stringify(about))} />;
}
