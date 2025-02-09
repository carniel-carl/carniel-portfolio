import { Variants } from "framer-motion";

const letterAnimeVariant: Variants = {
  initial: { y: 400 },
  visible: {
    y: 0,
    transition: {
      ease: [0.6, 0.01, -0.05, 0.95],
      duration: 1,
    },
  },
};

const staggerVariant: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.3, // Controls the delay between children animations
      delayChildren: 0.5, // Wait 0.5s before starting children animations
    },
  },
};

const blurVariant: Variants = {
  iniital: {
    filter: "blur(0px)",
    opacity: 1,
  },
  visible: {
    filter: "blur(3px)",
    opacity: 0.3,
    transition: {
      duration: 0.4,
    },
  },
  exit: {
    filter: "blur(0px)",
    opacity: 1,
    transition: {
      duration: 0.4,
    },
  },
};

export { staggerVariant, letterAnimeVariant, blurVariant };
