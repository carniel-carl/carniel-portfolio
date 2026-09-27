import HomeExperience from "@/sections/home/HomeExperience";
import { getLatestPosts, getProjects } from "@/lib/data/portfolio";
import { ViewTransition } from "react";
import { blogPageTransition } from "@/lib/blog/view-transitions";

const HomePage = async () => {
  const [{ featured }, posts] = await Promise.all([
    getProjects(),
    getLatestPosts(3),
  ]);

  return (
    <ViewTransition
      enter={blogPageTransition}
      exit={blogPageTransition}
      default="none"
    >
      <HomeExperience projects={featured.slice(0, 5)} posts={posts} />
    </ViewTransition>
  );
};

export default HomePage;
