"use server";

import { cacheTag, cacheLife } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import prisma from "../prisma";

const SOCIAL_LINK = "github";

const getPortfolioData = async () => {
  "use cache: remote";
  cacheTag(CACHE_TAGS.social, CACHE_TAGS.about);
  cacheLife("max");

  const [social, about] = await prisma.$transaction([
    prisma.socialLink.findFirst({
      where: {
        name: SOCIAL_LINK,
      },
      select: {
        link: true,
      },
    }),
    prisma.about.findFirst({
      select: {
        resumeUrl: true,
      },
    }),
  ]);

  return {
    githubUrl: social?.link || null,
    resumeUrl: about?.resumeUrl || null,
  };
};

export type PortfolioData = Awaited<ReturnType<typeof getPortfolioData>>;

export { getPortfolioData };
