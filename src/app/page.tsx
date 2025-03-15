"use client";
import { staggerVariant } from "@/components/animations/general";
import { AnimatePresence, motion } from "framer-motion";
import MaxWidth from "@/components/general/MaxWidth";
import AnimatedLetters from "@/components/general/AnimatedLetters";
// import BannerImage from "@/sections/BannerImage";
import Marquee from "react-fast-marquee";
import { useState } from "react";
import PreLoader from "@/components/layout/PreLoader";
import Image from "next/image";

const HomePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <>
      <AnimatePresence mode="sync">
        {isLoading ? (
          <motion.div key="preload">
            <PreLoader setIsLoading={setIsLoading} />
          </motion.div>
        ) : (
          <div className="w-screen min-h-[calc(100svh-8rem)] my-8 overflow-x-hidden">
            <motion.div
              variants={staggerVariant}
              initial="initial"
              animate="visible"
            >
              <MaxWidth>
                <motion.h4
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: 0.3 } }}
                  className="text-base italic font-montserrat"
                >
                  Hello, I&apos;m
                </motion.h4>
                <BannerTop title="Carniel" />
              </MaxWidth>
              <div>
                <BannerCenter title="Frontend" playMarquee={true} />
                {/* <BannerCenter
            title="Developer"
            playMarquee={true}
            direction="right"
          /> */}
              </div>
              <MaxWidth className="mt-4">
                {!isLoading && (
                  <motion.div
                    className="relative lg:w-[21rem] lg:h-[21rem] md:w-[18rem] md:h-[18rem] w-[19rem] h-[19rem] rounded-full overflow-hidden  border-2 border-accent ml-auto"
                    layoutId="main-image-1"
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
                )}
              </MaxWidth>
              {/* <BannerImage /> */}
              <div className="h-[30dvh]">hell0</div>
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
      <Marquee speed={80} direction={direction} play={playMarquee}>
        <motion.p
          initial={{ y: 200 }}
          animate={{ y: 0 }}
          transition={{ ease: [0.6, 0.01, -0.05, 0.9], duration: 1 }}
          className=" flex items-center gap-[2rem] mx-8 font-black md:text-[15rem] text-[6rem] leading-none "
        >
          <span className="text-accent flex items-center">
            <AnimatedLetters text={title} />
          </span>
          <span className="text-foreground/80 flex items-center">
            <AnimatedLetters text="Developer" disabled />
          </span>
        </motion.p>
      </Marquee>
    </>
  );
};

export default HomePage;
