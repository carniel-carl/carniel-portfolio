"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import ThemeColorSync from "@/components/general/ThemeColorSync";

const ThemeWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeColorSync />
      {children}
    </ThemeProvider>
  );
};

export default ThemeWrapper;
