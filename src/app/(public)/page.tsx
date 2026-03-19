"use client";
import { staggerVariant } from "@/components/animations/general";
import AnimatedLetters from "@/components/general/AnimatedLetters";
import MaxWidth from "@/components/general/MaxWidth";
import { AnimatePresence, motion } from "framer-motion";
// import BannerImage from "@/sections/BannerImage";
import PreLoader from "@/components/layout/PreLoader";
import { CornerRightUp } from "lucide-react";
import { useState } from "react";
import Marquee from "react-fast-marquee";

const HomePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="preload">
            <PreLoader setIsLoading={setIsLoading} />
          </motion.div>
        ) : (
          <div className="w-screen mt-8 overflow-x-hidden">
            <motion.div
              variants={staggerVariant}
              initial="initial"
              animate="visible"
              className=""
            >
              <MaxWidth className="relative">
                <motion.h4
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: 0.3 } }}
                  className="text-base italic font-montserrat"
                >
                  Hello, I&apos;m
                </motion.h4>
                <BannerTop title="Carniel" />
                <div className="fixed right-5 md:right-20 top-20 md:top-20 z-[20] animate-bounce">
                  <CornerRightUp className="text-accent opacity-70 size-5" />
                </div>
              </MaxWidth>

              <div>
                <BannerCenter title="Frontend" playMarquee={true} />
                <BannerCenter
                  title="Developer"
                  playMarquee={true}
                  direction="right"
                />
              </div>
              {/* <MaxWidth className="mt-4">
                <motion.div
                  className="relative lg:w-[21rem] lg:h-[21rem] md:w-[18rem] md:h-[18rem] w-[19rem] h-[19rem] rounded-full overflow-hidden  border-2 border-accent ml-auto"
                  transition={{
                    ease: [0.76, 0, 0.24, 1],
                    duration: 1.6,
                  }}
                >
                  <div className="absolute inset-0 z-10 w-full h-full bg-background/40" />
                  <Image
                    src="/images/profile-pic.jpg"
                    alt="profile pic"
                    fill
                    className="object-cover"
                  />
                </motion.div>
              </MaxWidth> */}
              {/* <BannerImage /> */}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

// HDR: Top Content
const BannerTop = ({ title }: { title: string }) => {
  return (
    <div className="grid md:grid-cols-[2fr_1fr] grid-cols-1 items-center w-full">
      <h2 className="flex font-semibold md:text-[4rem] text-[3rem]">
        <AnimatedLetters text={title} />
      </h2>

      <div className="overflow-hidden">
        <motion.p
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            ease: "easeInOut",
            duration: 1,
            delay: 0.2,
          }}
        >
          <span className="text-foreground/70">
            Specialise in building the foundation of your digital presence,
            crafting seamless and visually striking web experiences. With a
            perfect blend of creativity and technology, we set you up for
            success in the digital world.
          </span>
        </motion.p>
      </div>
    </div>
  );
};
const BannerCenter = ({
  title,
  playMarquee,
  direction = "left",
}: {
  title: string;
  playMarquee: boolean;
  direction?: "up" | "down" | "left" | "right";
}) => {
  return (
    <>
      <Marquee speed={50} direction={direction} play={playMarquee}>
        <motion.p
          initial={{ y: 200 }}
          animate={{ y: 0 }}
          transition={{ ease: [0.6, 0.01, -0.05, 0.9], duration: 1 }}
          className=" flex items-center gap-[2.5rem] mx-10 font-black md:text-[15rem] text-[9rem] leading-none "
        >
          <span className="text-accent flex items-center">
            <AnimatedLetters text={title} />
          </span>
          <span className="text-foreground/80 flex items-center">
            <AnimatedLetters text={title} disabled />
          </span>
        </motion.p>
      </Marquee>
    </>
  );
};

export default HomePage;
