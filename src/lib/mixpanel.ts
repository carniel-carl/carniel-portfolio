import mixpanel from "mixpanel-browser";

const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

if (
  typeof window !== "undefined" &&
  token &&
  process.env.NODE_ENV === "production"
) {
  mixpanel.init(token, {
    track_pageview: false,
    persistence: "localStorage",
  });
}

export function trackEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  const payload = { ...properties, timestamp: new Date().toISOString() };

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `%c[Mixpanel] ${event}`,
      "color: #7c3aed; font-weight: bold;",
      payload,
    );
    return;
  }

  if (!token) return;
  mixpanel.track(event, payload);
}
