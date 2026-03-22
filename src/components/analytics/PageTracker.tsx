"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/mixpanel";

function getDeviceType() {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export default function PageTracker({
  event,
  properties,
}: {
  event: string;
  properties?: Record<string, unknown>;
}) {
  useEffect(() => {
    trackEvent(event, {
      ...properties,
      referrer: document.referrer || undefined,
      device_type: getDeviceType(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
