import { Variants } from "framer-motion";

const letterAnimeVariant: Variants = {
  initial: {
    y: "100%",
    opacity: 0,
  },
  visible: (i) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 1, ease: [0.76, 0, 0.24, 1], delay: i[0] },
  }),
  exit: (i) => ({
    y: "100%",
    opacity: 0,
    transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1], delay: i[1] },
  }),
};

const staggerVariant: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.3, // Controls the delay between children animations
      // delayChildren: 0.1, // Wait 0.5s before starting children animations
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
const slideLeftVariant = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const slideUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const slideRightVariant = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

export {
  staggerVariant,
  letterAnimeVariant,
  blurVariant,
  slideLeftVariant,
  slideRightVariant,
  slideUpVariant,
};
