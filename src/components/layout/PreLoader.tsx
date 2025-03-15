"use client";
import { motion, Variants } from "framer-motion";
import { useEffect, useState, Dispatch, SetStateAction } from "react";

const container: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const slideUpVariant: Variants = {
  initial: { x: 0 },
  visible: {
    height: 0,

    transition: { duration: 0.3, ease: [0.76, 0, 0.24, 1] },
  },
  exit: {
    height: 0,

    transition: { duration: 0.3, ease: [0.76, 0, 0.24, 1] },
  },
};
// const itemMain = {
//   hidden: { opacity: 0, y: 200 },
//   show: {
//     opacity: 1,
//     y: 0,
//     transition: {
//       ease: [0.76, 0, 0.24, 1],
//       duration: 1.6,
//     },
//   },
//   exit: {
//     opacity: 0,
//     y: -100,
//     transition: {
//       ease: [0.76, 0, 0.24, 1],
//       duration: 1.6,
//     },
//   },
// };

const PreLoader = ({
  setIsLoading,
}: {
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const delay = Math.floor(Math.random() * 200) + 50;
    const timer = setTimeout(() => {
      setCount((prev) => {
        if (prev >= 100) return 100;
        else return prev + Math.floor(Math.random() * 10) + 1;
      });
    }, delay);

    () => clearTimeout(timer);
  }, [count]);

  return (
    <section className="fixed inset-0 bg-transparent w-screen h-screen z-[100]">
      <motion.div
        initial={{ opacity: 1 }}
        animate={
          count === 100
            ? { opacity: 0, transition: { duration: 0.1, ease: "easeInOut" } }
            : undefined
        }
        className="fixed flex items-end justify-end w-full h-full inset-0 p-12"
      >
        <h3 className="text-[20vw] font-mono font-black leading-none dark:text-black text-white">
          {count}
        </h3>
      </motion.div>
      {/* <div className="fixed w-full h-full inset-0 flex items-center justify-center">
        <motion.div
          className="relative lg:w-[32rem] lg:h-[25rem] md:w-[18rem] md:h-[18rem] w-[19rem] h-[19rem]"
          layoutId="main-image-1"
          variants={itemMain}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          <Image
            src="/images/profile-pic.jpg"
            alt="profile pic"
            fill
            className="object-cover"
          />
        </motion.div>
      </div> */}
      <motion.div
        className="flex"
        variants={container}
        initial="initial"
        animate={count === 100 ? "visible" : "initial"}
        onAnimationComplete={() => setIsLoading(false)}
        exit="exit"
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            variants={slideUpVariant}
            key={`box ${i}`}
            className="w-[10vw] h-[105vh] dark:bg-[hsl(9,3%,92%)] bg-[hsl(20,14.3%,4.1%)]"
          />
        ))}
      </motion.div>
    </section>
  );
};

export default PreLoader;
