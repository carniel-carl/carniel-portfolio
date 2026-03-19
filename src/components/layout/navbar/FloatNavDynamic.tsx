"use client";
import nextDynamic from "next/dynamic";

const FloatNav = nextDynamic(
  () => import("@/components/layout/navbar/FloatNav"),
  {
    ssr: false,
  },
);
const FloatNavDynamic = () => {
  return <FloatNav />;
};

export default FloatNavDynamic;
