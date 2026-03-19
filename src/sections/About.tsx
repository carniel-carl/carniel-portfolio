import prisma from "@/lib/prisma";
import AboutClient from "./AboutClient";

const About = async () => {
  const about = await prisma.about.findFirst();
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
