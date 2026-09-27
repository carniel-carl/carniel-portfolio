import HomeExperience from "@/sections/home/HomeExperience";
import { getContactInfo, getLatestPosts, getProjects } from "@/lib/data/portfolio";
import { ViewTransition } from "react";
import { blogPageTransition } from "@/lib/blog/view-transitions";
import type { Metadata } from "next";
import { PersonJsonLd } from "@/components/seo/JsonLd";
import { BASE_OPEN_GRAPH, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    ...BASE_OPEN_GRAPH,
    url: "/",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

const HomePage = async () => {
  const [{ featured }, posts, contact] = await Promise.all([
    getProjects(),
    getLatestPosts(3),
    getContactInfo(),
  ]);

  return (
    <ViewTransition
      enter={blogPageTransition}
      exit={blogPageTransition}
      default="none"
    >
      <>
        <PersonJsonLd />
        <HomeExperience projects={featured.slice(0, 5)} posts={posts} contact={contact} />
      </>
    </ViewTransition>
  );
};

export default HomePage;
