import { Variants } from "framer-motion";

const staggerContainer: Variants = {
  hidden: {
    transition: {
      staggerDirection: -1,
    },
  },
  visible: {
    transition: {
      staggerChildren: 0.3, // Controls the delay between children animations
      delayChildren: 0.4, // Wait 0.5s before starting children animations
      staggerDirection: 1,
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
  slideLeftVariant,
  slideRightVariant,
  slideUpVariant,
  staggerContainer,
};
