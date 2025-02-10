"use client";
import {
  letterAnimeVariant,
  staggerVariant,
} from "@/components/animations/general";
import { motion } from "framer-motion";
import MaxWidth from "@/components/general/MaxWidth";

import AnimatedLetters from "@/components/general/AnimatedLetters";
import BannerImage from "@/sections/BannerImage";
import Marquee from "react-fast-marquee";

const HomePage = () => {
  return (
    <>
      <motion.div
        variants={staggerVariant}
        initial="initial"
        animate="visible"
        className="w-screen min-h-[calc(100svh-8rem)] my-8 overflow-x-hidden"
      >
        <MaxWidth>
          <h4 className="text-lg ">Hello, I'm</h4>
          <BannerTop title="Carniel" />
        </MaxWidth>
        <div>
          <BannerCenter title="Frontend" playMarquee={true} />
        </div>

        <BannerImage />
        <div className="h-screen">hell0</div>
      </motion.div>
    </>
  );
};

// HDR: Top Content
const BannerTop = ({ title }: { title: string }) => {
  return (
    <div className="grid md:grid-cols-[2fr_1fr] grid-cols-1 items-center w-full">
      <h2 className="flex font-semibold  md:text-[6rem] text-[3rem]">
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
          className=""
        >
          <span className="">
            We are specialised in setting up the foundation of your brand and
            setting you up for success.
          </span>
        </motion.p>
      </div>
    </div>
  );
};
const BannerCenter = ({
  title,
  playMarquee,
}: {
  title: string;
  playMarquee: boolean;
}) => {
  return (
    <>
      <Marquee speed={140} direction="left" play={playMarquee}>
        <motion.p
          initial={{ y: 200 }}
          animate={{ y: 0 }}
          transition={{ ease: [0.6, 0.01, -0.05, 0.9], duration: 1 }}
          className=" flex items-center gap-[6rem] mx-16 font-semibold md:text-[16rem] text-[7rem] "
        >
          <span className="text-accent flex items-center">
            <AnimatedLetters text={title} />
          </span>
          <AnimatedLetters text="Developer" disabled />
          {/* <AnimatedLetters text={title} /> */}
          {/* <AnimatedLetters text={title} /> */}
        </motion.p>
      </Marquee>
    </>
  );
};

export default HomePage;
