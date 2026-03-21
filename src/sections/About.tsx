import { getCachedAbout } from "@/lib/actions/about";
import AboutClient from "@/sections/AboutClient";

const About = async () => {
  const about = await getCachedAbout();

  return (
    <AboutClient
      about={
        about
          ? {
              bio: about.bio,
              profilePicUrl: about.profilePicUrl,
              resumeUrl: about.resumeUrl,
            }
          : null
      }
    />
  );
};

export default About;
