import SocialClient from "@/components/admin/SocialClient";
import { CACHE_TAGS } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";

export default async function SocialLinksPage() {
  "use cache: remote";
  cacheTag(CACHE_TAGS.social);
  cacheLife("max");
  const links = await prisma.socialLink.findMany();

  return <SocialClient links={JSON.parse(JSON.stringify(links))} />;
}
