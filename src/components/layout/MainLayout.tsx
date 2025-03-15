"use client";

import PreLoader from "@/components/layout/PreLoader";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import Navbar from "./navbar/Navbar";
import Footer from "./Footer";

const MainLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <>
      <AnimatePresence mode="sync">
        {isLoading ? (
          <motion.div key="preload">
            <PreLoader setIsLoading={setIsLoading} />
          </motion.div>
        ) : (
          <>
            <div className="grid grid-rows-[4.5rem_1fr]">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] },
                }}
              >
                <Navbar />
              </motion.div>
              <main className="row-start-2 row-end-3">{children}</main>
            </div>
            <Footer />
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MainLayout;
