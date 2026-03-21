import MaxWidth from "@/components/general/MaxWidth";
import FloatNavDynamic from "@/components/layout/navbar/FloatNavDynamic";
import ScrollToTop from "@/components/layout/ScrollToTop";
import AboutClient from "@/sections/AboutClient";
import Contact from "@/sections/Contact";
import ProjectsClient from "@/sections/ProjectsClient";
import SkillsClient from "@/sections/SkillsClient";
import prisma from "@/lib/prisma";
import { cacheTag, cacheLife } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { Suspense } from "react";

async function getAbout() {
  "use cache: remote";
  cacheTag(CACHE_TAGS.about);
  cacheLife("max");

  const about = await prisma.about.findFirst();

  return about
    ? {
        bio: about.bio,
        profilePicUrl: about.profilePicUrl,
        resumeUrl: about.resumeUrl,
      }
    : null;
}

async function getProjects() {
  "use cache: remote";
  cacheTag(CACHE_TAGS.projects);
  cacheLife("max");

  const featured = await prisma.project.findMany({
    where: { featured: true, visible: { not: false } },
    orderBy: { order: "asc" },
  });
  const other = await prisma.project.findMany({
    where: { featured: false, visible: { not: false } },
    orderBy: { order: "asc" },
  });

  const mapProject = (p: (typeof featured)[number]) => ({
    name: p.name,
    tag: p.tag || undefined,
    description: p.description,
    img: p.img,
    live: p.live || undefined,
    code: p.code || undefined,
    stack: p.stack,
  });

  return {
    featured: featured.map(mapProject),
    other: other.map(mapProject),
  };
}

async function getSkills() {
  "use cache: remote";
  cacheTag(CACHE_TAGS.skills);
  cacheLife("max");

  const skills = await prisma.skill.findMany({ orderBy: { order: "asc" } });

  return skills.map((s) => ({
    id: s.id,
    title: s.title,
    iconName: s.iconName,
  }));
}

const PortfolioPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) => {
  const { tab } = await searchParams;
  const [about, { featured, other }, skills] = await Promise.all([
    getAbout(),
    getProjects(),
    getSkills(),
  ]);

  return (
    <div className="w-screen min-h-[calc(100svh-2rem)] overflow-x-hidden">
      <FloatNavDynamic />
      <ScrollToTop />
      <MaxWidth className="lg:!max-w-[65rem] md:!max-w-[40rem] mb-24 w-[90%] mx-auto ">
        <Suspense fallback={null}>
          <AboutClient about={about} />
        </Suspense>

        <div className="divider" />

        <ProjectsClient
          featured={featured}
          other={other}
          tab={tab === "other" ? "other" : "featured"}
        />

        <div className="divider" />

        <SkillsClient skills={skills} />
        <div className="divider" />
        <Contact />
      </MaxWidth>
    </div>
  );
};

export default PortfolioPage;
