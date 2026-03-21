import { cacheTag, cacheLife } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";
import Navbar from "./Navbar";

const SocialLinks = async () => {
  "use cache: remote";
  cacheTag(CACHE_TAGS.social);
  cacheLife("max");

  const socialLinks = await prisma.socialLink.findMany();

  return (
    <Navbar
      socialLinks={socialLinks.map(({ name, link }) => ({ name, link }))}
    />
  );
};

export default SocialLinks;
