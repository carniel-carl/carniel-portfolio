"use client";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

import PageLoader from "@/components/general/PageLoader";
const HomePage = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 3000);
  }, []);
  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <PageLoader />}
      </AnimatePresence>
      <div className="w-full h-[calc(100svh-7rem)] flex items-center justify-center">
        HomePage
      </div>
    </>
  );
};

export default HomePage;
