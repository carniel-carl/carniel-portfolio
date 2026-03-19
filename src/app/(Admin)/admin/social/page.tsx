export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import SocialClient from "@/components/admin/SocialClient";

export default async function SocialLinksPage() {
  const links = await prisma.socialLink.findMany();

  return <SocialClient links={JSON.parse(JSON.stringify(links))} />;
}
