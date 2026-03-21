import { cacheTag, cacheLife } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";
import AboutClient from "@/sections/AboutClient";

const About = async () => {
  "use cache: remote";
  cacheTag(CACHE_TAGS.about);
  cacheLife("hours");
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
