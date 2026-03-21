import MaxWidth from "@/components/general/MaxWidth";
import FloatNavDynamic from "@/components/layout/navbar/FloatNavDynamic";
import ScrollToTop from "@/components/layout/ScrollToTop";
import About from "@/sections/About";
import Contact from "@/sections/Contact";
import Projects from "@/sections/Projects";
import Skills from "@/sections/Skills";
import { Suspense } from "react";
import { cacheTag, cacheLife } from "next/cache";
import prisma from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import ProjectsClient from "@/components/admin/ProjectsClient";

async function getProjects() {
  "use cache: remote";
  cacheTag(CACHE_TAGS.projects);
  cacheLife("max");

  const [featured, other] = await prisma.$transaction([
    prisma.project.findMany({
      where: { featured: true },
      orderBy: { order: "asc" },
    }),
    prisma.project.findMany({
      where: { featured: false },
      orderBy: { order: "asc" },
    }),
  ]);

  return {
    featured: JSON.parse(JSON.stringify(featured)),
    other: JSON.parse(JSON.stringify(other)),
  };
}

const PortfolioPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) => {
  const { tab } = await searchParams;
  const activeTab = tab === "other" ? "other" : "featured";
  const { featured, other } = await getProjects();
  return (
    <div className="w-screen min-h-[calc(100svh-2rem)] overflow-x-hidden">
      {/* <FloatNavDynamic /> */}
      <ScrollToTop />
      <MaxWidth className="lg:!max-w-[65rem] md:!max-w-[40rem] mb-24 w-[90%] mx-auto ">
        <div className="divider" />
        <ProjectsClient
          featured={featured}
          other={other}
          activeTab={activeTab}
        />
      </MaxWidth>
    </div>
  );
};

export default PortfolioPage;

const TestPage = () => {
  return (
    <>
      <Suspense fallback={null}>
        <About />
      </Suspense>
      <div className="divider" />

      <Suspense fallback={null}>
        <Projects />
      </Suspense>
      <div className="divider" />
      <Suspense fallback={null}>
        <Skills />
      </Suspense>
      <div className="divider" />
      <Contact />
    </>
  );
};
