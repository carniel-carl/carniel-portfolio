"use cache";
import { cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import AboutClient from "@/sections/AboutClient";

const About = async () => {
  cacheTag(CACHE_TAGS.about);
  cacheLife("max");
  const about = await prisma.about.findFirst();
  return (
    <AboutClient
      about={
        about
          ? {
              bio: about.bio,
              profilePicUrl: about.profilePicUrl,
              resumeUrl: about.resumeUrl,
            }
          : null
      }
    />
  );
};

export default About;
