"use client";
import { motion, Variants } from "framer-motion";
import { Dispatch, SetStateAction } from "react";

const container: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const slideLeftVariant = {
  initial: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.9, ease: "easeInOut" },
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
  },
};

const PreLoader = ({
  setIsLoading,
}: {
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}) => {
  return (
    <motion.div
      variants={{
        initial: {
          y: "0",
        },
        exit: {
          y: "-110vh",
          transition: {
            duration: 1.5,
            ease: [0.76, 0, 0.24, 1],
            delay: 0.2,
          },
        },
      }}
      initial="initial"
      exit="exit"
      className="preloader bg-background border-b-2 border-accent fixed z-[100] h-[105svh] inset-0 flex items-center justify-center"
    >
      <motion.div
        variants={container}
        initial="initial"
        animate="visible"
        exit="exit"
        onAnimationComplete={() => setIsLoading(false)}
        className="flex items-center justify-center"
      >
        <div>
          <motion.div variants={slideLeftVariant}>I am loading</motion.div>
          <motion.div variants={slideLeftVariant}>I Second</motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PreLoader;
