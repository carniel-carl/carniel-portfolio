import { cacheTag, cacheLife } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";
import Footer from "./Footer";
import { getContactInfo } from "@/lib/data/portfolio";

const SiteFooter = async () => {
  "use cache: remote";
  cacheTag(CACHE_TAGS.social);
  cacheLife("max");

  const [socialLinks, contact] = await Promise.all([
    prisma.socialLink.findMany(),
    getContactInfo(),
  ]);

  return (
    <Footer
      socialLinks={socialLinks.map(({ name, link }) => ({ name, link }))}
      contact={contact}
    />
  );
};

export default SiteFooter;
