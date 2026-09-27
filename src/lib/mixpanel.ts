import type { OverridedMixpanel } from "mixpanel-browser";

const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

// NODE_ENV is "production" for `next start` locally and for Vercel preview
// deploys too, so only the real production deployment sends events.
const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

// mixpanel-browser reads the clock when its module evaluates, which Next's
// prerender rejects for Client Components rendered outside a Suspense
// boundary. Load it lazily, in the browser only, on the first tracked event.
let client: Promise<OverridedMixpanel> | null = null;

function getClient() {
  if (!client) {
    client = import("mixpanel-browser").then(({ default: mixpanel }) => {
      mixpanel.init(token!, {
        track_pageview: false,
        persistence: "localStorage",
        api_host: "https://api-eu.mixpanel.com",
      });
      return mixpanel;
    });
  }
  return client;
}

export function trackEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  const payload = { ...properties, timestamp: new Date().toISOString() };

  if (!isProduction) {
    console.log(
      `%c[Mixpanel] ${event}`,
      "color: #7c3aed; font-weight: bold;",
      payload,
    );
    return;
  }

  if (!token || typeof window === "undefined") return;
  getClient()
    .then((mixpanel) => mixpanel.track(event, payload))
    .catch(() => {});
}
