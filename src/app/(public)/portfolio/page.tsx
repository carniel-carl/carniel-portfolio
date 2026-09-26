import FloatNavDynamic from "@/components/layout/navbar/FloatNavDynamic";
import AboutClient from "@/sections/AboutClient";
import Contact from "@/sections/Contact";
import ProjectsClient from "@/sections/ProjectsClient";
import SkillsClient from "@/sections/SkillsClient";
import PageTracker from "@/components/analytics/PageTracker";
import {
  getAbout,
  getProjects,
  getPublishedPostCount,
  getSkills,
} from "@/lib/data/portfolio";
import Highlights from "@/sections/portfolio/Highlights";
import Process from "@/sections/portfolio/Process";
import { Suspense } from "react";
import Intro from "@/components/layout/Intro";

const PortfolioPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) => {
  const { tab } = await searchParams;
  const [about, { featured, other }, skills, articles] = await Promise.all([
    getAbout(),
    getProjects(),
    getSkills(),
    getPublishedPostCount(),
  ]);

  return (
    // overflow-x-clip (not hidden) so the sticky project stack keeps working
    <div className="w-full overflow-x-clip">
      <PageTracker event="Portfolio Viewed" />
      <Intro>
      <FloatNavDynamic />
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <Suspense fallback={null}>
          <AboutClient about={about} />
        </Suspense>

        <Highlights
          projects={featured.length + other.length}
          skills={skills.length}
          articles={articles}
        />

        <div className="h-24 md:h-40" />

        <ProjectsClient
          featured={featured}
          other={other}
          tab={tab === "other" ? "other" : "featured"}
        />

        <Process />

        <SkillsClient skills={skills} />

        <Contact />
      </div>
      </Intro>
    </div>
  );
};

export default PortfolioPage;
