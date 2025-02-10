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

export { staggerContainer };
