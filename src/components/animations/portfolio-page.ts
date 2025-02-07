import { Variants } from "framer-motion";

const slideLeftVariant: Variants = {
  hidden: {
    opacity: 0,
    x: -90,
    transition: {
      delay: 0.8,
      duration: 1,
      ease: "easeOut",
    },
  },
  visible: {
    opacity: 1,
    x: 0,
  },
};
const slideRightVariant: Variants = {
  hidden: {
    opacity: 0,
    x: 90,
    transition: {
      delay: 0.9,
      duration: 1,
      ease: "easeOut",
    },
  },
  visible: {
    opacity: 1,
    x: 0,
  },
};
const slideUpVariant: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
    transition: {
      delay: 0.9,
      duration: 1,
      ease: "easeOut",
    },
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

const staggerVariant: Variants = {
  hidden: {
    transition: {
      staggerChildren: 0.09,
    },
  },
  visible: {
    transition: {
      staggerChildren: 0.8,
      //   delayChildren: 1,
    },
  },
};

export { slideLeftVariant, slideRightVariant, slideUpVariant, staggerVariant };
