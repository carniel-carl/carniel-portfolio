import { Variants } from "framer-motion";

// const menuVariant: Variants = {
//   initial: {
//     scaleY: 0,
//   },
//   animate: {
//     scaleY: 1,
//     transition: {
//       duration: 0.5,
//       ease: [0.12, 0, 0.39, 0],
//     },
//   },
//   exit: {
//     scaleY: 0,
//     transition: {
//       delay: 0.5,
//       duration: 0.5,
//       ease: [0.22, 1, 0.36, 1],
//     },
//   },
// };
const menuVariant: Variants = {
  open: {
    width: 350,
    height: 500,
    top: -5,
    right: -5,
    transition: { duration: 0.75, ease: [0.76, 0, 0.24, 1] },
  },
  closed: {
    width: 83.2,
    height: 36.8,
    top: 0,
    right: 0,
    transition: { duration: 0.75, ease: [0.76, 0, 0.24, 1] },
  },
};
const menuLinkVariant: Variants = {
  initial: {
    y: "30vh",
    transition: {
      duration: 0.5,
      ease: [0.37, 0, 0.63, 1],
    },
  },
  open: {
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0, 0.55, 0.45, 1],
    },
  },
};
const containerVariant: Variants = {
  initial: {
    transition: {
      staggerChildren: 0.09,
      staggerDirection: -1,
    },
  },
  open: {
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.09,
      staggerDirection: 1,
    },
  },
};

export { menuLinkVariant, menuVariant, containerVariant };
