"use client";
import { motion } from "framer-motion";

const PageLoader = () => {
  return (
    <>
      <motion.div
        variants={{
          initial: {
            y: "0",
          },
          exit: {
            y: "-110vh",
            transition: {
              duration: 0.9,
              ease: [0.76, 0, 0.24, 1],
              delay: 0.2,
            },
          },
        }}
        initial="initial"
        exit="exit"
        className={`load `}
      >
        <div className="loaders">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </motion.div>
    </>
  );
};

export default PageLoader;
