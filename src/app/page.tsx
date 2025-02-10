"use client";
import {
  letterAnimeVariant,
  staggerVariant,
} from "@/components/animations/general";
import { motion } from "framer-motion";
import MaxWidth from "@/components/general/MaxWidth";

import AnimatedLetters from "@/components/general/AnimatedLetters";
import BannerImage from "@/sections/BannerImage";

const HomePage = () => {
  return (
    <>
      <motion.div
        variants={staggerVariant}
        initial="initial"
        animate="visible"
        className="w-full min-h-[calc(100svh-8rem)] my-8"
      >
        <MaxWidth>
          <h4 className="text-lg ">Hello, I'm</h4>
          <BannerTop title="Carniel" />
          <BannerCenter title="Frontend" playMarquee={false} />
        </MaxWidth>

        <BannerImage />
        <div className="h-screen">hell0</div>
      </motion.div>
    </>
  );
};

const BannerTop = ({ title }: { title: string }) => {
  return (
    <div className="grid md:grid-cols-2 grid-cols-1 items-center">
      <h2 className="flex font-semibold md:text-[8rem] text-[3rem] overflow-hidden">
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
    <div
      className={`banner-row marquee overflow-hidden  ${
        playMarquee && "animate"
      }`}
    >
      <motion.p
        initial={{ y: 310 }}
        animate={{ y: 0 }}
        transition={{ ease: [0.6, 0.01, -0.05, 0.9], duration: 1 }}
        className="marquee__inner"
      >
        <AnimatedLetters text={title} disabled />
        <AnimatedLetters text={title} />
        <AnimatedLetters text={title} disabled />
        <AnimatedLetters text={title} disabled />
      </motion.p>
    </div>
  );
};

export default HomePage;
