"use cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";
import AboutClient from "@/sections/AboutClient";
import { cacheTag } from "next/cache";

const About = async () => {
  cacheTag(CACHE_TAGS.about);

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
