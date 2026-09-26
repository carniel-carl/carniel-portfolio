"use client";

import { Download } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import parse from "html-react-parser";
import sanitizeHtml from "sanitize-html";
import { trackEvent } from "@/lib/mixpanel";
import SplitText from "@/components/motion/SplitText";
import PillLink from "@/components/motion/PillLink";
import Magnetic from "@/components/motion/Magnetic";
import { useIntroReady } from "@/components/layout/Intro";

interface AboutClientProps {
  about: {
    bio: string;
    profilePicUrl: string;
    resumeUrl: string;
  } | null;
}

const EASE = [0.16, 1, 0.3, 1] as const;

const AboutClient = ({ about }: AboutClientProps) => {
  const bio =
    about?.bio ||
    "<p>I discovered my passion for coding while building a website for my art business. Since then, I have immersed myself in the world of technology, continuously expanding my skills and exploring its vast potential. Combining creativity with functionality, makes my journey in tech both fulfilling and dynamic.</p>";
  const profilePicUrl = about?.profilePicUrl || "/images/profile-pic.jpg";
  const resumeUrl = about?.resumeUrl || "/chimezie-resume.pdf";

  const frameRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const ready = useIntroReady();
  const { scrollYProgress } = useScroll({
    target: frameRef,
    offset: ["start end", "end start"],
  });
  // Image drifts inside its frame for depth while the frame scrolls normally
  const imageY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section
      id="about"
      className="portfolio grid grid-cols-1 gap-12 pb-24 pt-10 md:grid-cols-12 md:gap-8 md:pb-40 md:pt-16"
    >
      {/* SUB: Text section */}
      <div className="flex flex-col md:col-span-7 md:pr-8">
        <SplitText
          as="h1"
          text="About me"
          by="char"
          className="font-display text-[clamp(4rem,13vw,11rem)] font-semibold leading-[0.85] tracking-[-0.045em] [font-stretch:75%]"
        />

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30 }}
          animate={ready ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 1, ease: EASE, delay: 0.2 }}
          className="mt-10 max-w-[52ch] text-lg leading-relaxed text-foreground/75 md:mt-14 md:text-xl [&_a]:text-accent-ink [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-5 [&_strong]:text-foreground"
        >
          {parse(
            sanitizeHtml(bio, {
              allowedTags: [
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
              allowedAttributes: { a: ["href", "target", "rel"] },
            }),
          )}
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={ready ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 1, ease: EASE, delay: 0.35 }}
          className="mt-10"
        >
          <Magnetic strength={0.25}>
            <PillLink
              href={resumeUrl}
              icon={<Download />}
              download="chimezie-resume"
              onClick={() =>
                trackEvent("Resume Downloaded", { source_page: "about" })
              }
            >
              Download resume
            </PillLink>
          </Magnetic>
        </motion.div>
      </div>

      {/* SUB: Image Section */}
      <div className="md:col-span-5 md:pt-24">
        <motion.div
          ref={frameRef}
          initial={reduce ? false : { clipPath: "inset(12% 12% 12% 12% round 1.25rem)", opacity: 0 }}
          animate={ready ? { clipPath: "inset(0% 0% 0% 0% round 1.25rem)", opacity: 1 } : undefined}
          transition={{ duration: 1.4, ease: [0.76, 0, 0.24, 1] }}
          className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.25rem] bg-surface"
        >
          <motion.div
            style={reduce ? undefined : { y: imageY }}
            className="absolute inset-x-0 -inset-y-[10%]"
          >
            <Image
              src={profilePicUrl}
              alt="Portrait of Chimezie Nmugha"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 40vw"
              priority
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutClient;
