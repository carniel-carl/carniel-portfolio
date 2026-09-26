"use client";

import { useEffect } from "react";
import Intro from "@/components/layout/Intro";
import Hero from "@/sections/home/Hero";
import VelocityMarquee from "@/sections/home/VelocityMarquee";
import Statement from "@/sections/home/Statement";
import SelectedWork from "@/sections/home/SelectedWork";
import Capabilities from "@/sections/home/Capabilities";
import LatestWriting from "@/sections/home/LatestWriting";
import { trackEvent } from "@/lib/mixpanel";
import type { ProjectDataType } from "@/types/project";
import type { LatestPost } from "@/lib/data/portfolio";

const HomeExperience = ({
  projects,
  posts,
}: {
  projects: ProjectDataType[];
  posts: LatestPost[];
}) => {
  useEffect(() => {
    trackEvent("Home Viewed", {
      referrer: document.referrer || undefined,
    });
  }, []);

  return (
    <Intro>
      <Hero />
      <VelocityMarquee />
      <Statement />
      <Capabilities />
      <SelectedWork projects={projects} />
      <LatestWriting posts={posts} />
    </Intro>
  );
};

export default HomeExperience;
