"use client";

import { useEffect } from "react";
import Intro from "@/components/layout/Intro";
import Hero from "@/sections/home/Hero";
import VelocityMarquee from "@/sections/home/VelocityMarquee";
import Statement from "@/sections/home/Statement";
import TwoDoors from "@/sections/home/TwoDoors";
import Capabilities from "@/sections/home/Capabilities";
import LatestWriting from "@/sections/home/LatestWriting";
import { trackEvent } from "@/lib/mixpanel";
import type { LatestPost } from "@/lib/data/portfolio";
import type { ContactInfo } from "@/lib/availability";

const HomeExperience = ({
  posts,
  contact,
}: {
  posts: LatestPost[];
  contact: ContactInfo;
}) => {
  useEffect(() => {
    trackEvent("Home Viewed", {
      referrer: document.referrer || undefined,
    });
  }, []);

  return (
    <Intro>
      <Hero contact={contact} />
      <VelocityMarquee />
      <TwoDoors contact={contact} />
      <Statement />
      <Capabilities />
      <LatestWriting posts={posts} />
    </Intro>
  );
};

export default HomeExperience;
