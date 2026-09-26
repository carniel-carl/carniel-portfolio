import { cacheTag, cacheLife } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";
import Footer from "./Footer";

const SiteFooter = async () => {
  "use cache: remote";
  cacheTag(CACHE_TAGS.social);
  cacheLife("max");

  const socialLinks = await prisma.socialLink.findMany();

  return (
    <Footer
      socialLinks={socialLinks.map(({ name, link }) => ({ name, link }))}
    />
  );
};

export default SiteFooter;
