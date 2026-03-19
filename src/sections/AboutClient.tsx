"use client";

import { buttonVariants } from "@/components/ui/button";
import { Download } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { staggerContainer } from "@/components/animations/portfolio-page";
import {
  slideLeftVariant,
  slideRightVariant,
  slideUpVariant,
} from "@/components/animations/general";
import parse from "html-react-parser";
import DOMPurify from "isomorphic-dompurify";

interface AboutClientProps {
  about: {
    bio: string;
    profilePicUrl: string;
    resumeUrl: string;
  } | null;
}

const AboutClient = ({ about }: AboutClientProps) => {
  const bio =
    about?.bio ||
    "<p>I discovered my passion for coding while building a website for my art business. Since then, I have immersed myself in the world of technology, continuously expanding my skills and exploring its vast potential. Combining creativity with functionality, makes my journey in tech both fulfilling and dynamic.</p>";
  const profilePicUrl = about?.profilePicUrl || "/images/profile-pic.jpg";
  const resumeUrl = about?.resumeUrl || "/chimezie-resume.pdf";

  return (
    <motion.section
      id="about"
      className="portfolio flex md:flex-row flex-col items-center lg:gap-x-24 md:gap-x-12 gap-y-12 md:mt-20 mt-10"
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* SUB: Image Section */}
      <motion.div variants={slideLeftVariant} className="w-fit relative">
        <div className="relative lg:w-[21rem] lg:h-[28rem] md:w-[18rem] md:h-[22rem] w-[19rem] h-[18rem] about-profile__after">
          <Image
            src={profilePicUrl}
            alt="profile pic"
            fill
            className="object-cover rounded-2xl scale-95"
            priority
          />
        </div>
      </motion.div>

      {/* SUB: Text section */}
      <motion.div
        className="flex flex-col items-center md:items-start text-center md:text-left"
        variants={staggerContainer}
      >
        <motion.h2
          variants={slideUpVariant}
          className="heading-style after:content-['get_to_know_me'] font-nunito after:font-montserrat self-start"
        >
          About
        </motion.h2>

        <motion.div
          variants={slideRightVariant}
          className="text-lg mb-8 mt-8 max-w-[40rem] w-full text-foreground/70 font-medium"
        >
          {parse(
            DOMPurify.sanitize(bio, {
              ALLOWED_TAGS: [
                "b",
                "i",
                "em",
                "strong",
                "a",
                "p",
                "ul",
                "li",
                "br",
                "h1",
                "h2",
                "h3",
                "h4",
                "ol",
              ],
              ALLOWED_ATTR: ["href", "target", "rel"],
            }),
          )}
        </motion.div>

        <motion.div variants={slideUpVariant}>
          <a
            href={resumeUrl}
            className={`${buttonVariants()} py-6 `}
            download="chimezie-resume"
            target="_blank"
          >
            <span className="capitalize">Download resume</span>
            <Download />
          </a>
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

export default AboutClient;
