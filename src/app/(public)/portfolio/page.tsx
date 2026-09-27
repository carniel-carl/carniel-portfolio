import FloatNavDynamic from "@/components/layout/navbar/FloatNavDynamic";
import AboutClient from "@/sections/AboutClient";
import Contact from "@/sections/Contact";
import ProjectsClient from "@/sections/ProjectsClient";
import SkillsClient from "@/sections/SkillsClient";
import PageTracker from "@/components/analytics/PageTracker";
import {
  getAbout,
  getContactInfo,
  getProjects,
  getPublishedPostCount,
  getSkills,
} from "@/lib/data/portfolio";
import { getPortfolioData } from "@/lib/actions/utils";
import Highlights from "@/sections/portfolio/Highlights";
import Process from "@/sections/portfolio/Process";
import { Suspense } from "react";
import Intro from "@/components/layout/Intro";
import type { Metadata } from "next";
import { PersonJsonLd } from "@/components/seo/JsonLd";
import { BASE_OPEN_GRAPH, SITE_NAME } from "@/lib/site";

const PORTFOLIO_DESCRIPTION =
  "Selected web and mobile projects by Chimezie (Carniel): what I built, the stack behind it, and how I work.";

export const metadata: Metadata = {
  title: "Portfolio",
  description: PORTFOLIO_DESCRIPTION,
  alternates: { canonical: "/portfolio" },
  openGraph: {
    ...BASE_OPEN_GRAPH,
    url: "/portfolio",
    title: `Portfolio · ${SITE_NAME}`,
    description: PORTFOLIO_DESCRIPTION,
  },
};

const PortfolioPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) => {
  const { tab } = await searchParams;
  const [about, { featured, other }, skills, articles, contact, contactInfo] =
    await Promise.all([
      getAbout(),
      getProjects(),
      getSkills(),
      getPublishedPostCount(),
      getPortfolioData(),
      getContactInfo(),
    ]);

  return (
    // overflow-x-clip (not hidden) so the sticky project stack keeps working
    <div className="w-full overflow-x-clip">
      <PageTracker event="Portfolio Viewed" />
      <PersonJsonLd />
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

        <Contact
          githubUrl={contact.githubUrl}
          resumeUrl={contact.resumeUrl}
          contactInfo={contactInfo}
        />
      </div>
      </Intro>
    </div>
  );
};

export default PortfolioPage;
