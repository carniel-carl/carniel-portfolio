"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ADSENSE_CLIENT } from "@/lib/adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSlotProps {
  slot: string | undefined;
  className?: string;
}

export default function AdSlot({ slot, className }: AdSlotProps) {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    const ins = insRef.current;
    // Skip if AdSense already filled this <ins> (e.g. Strict Mode re-run)
    if (!ins || ins.dataset.adsbygoogleStatus) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error("AdSense failed to load:", error);
    }
  }, []);

  // Render nothing until AdSense is configured
  if (!ADSENSE_CLIENT || !slot) return null;

  return (
    <ins
      ref={insRef}
      className={cn("adsbygoogle block h-[600px] w-full", className)}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format="vertical"
      data-full-width-responsive="false"
    />
  );
}
