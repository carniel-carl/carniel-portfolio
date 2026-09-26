import HomeExperience from "@/sections/home/HomeExperience";
import { getLatestPosts, getProjects } from "@/lib/data/portfolio";

const HomePage = async () => {
  const [{ featured }, posts] = await Promise.all([
    getProjects(),
    getLatestPosts(3),
  ]);

  return <HomeExperience projects={featured.slice(0, 5)} posts={posts} />;
};

export default HomePage;
