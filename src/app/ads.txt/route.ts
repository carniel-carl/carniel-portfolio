// AdSense requires /ads.txt to authorise your publisher ID to sell ads here.
// Built from NEXT_PUBLIC_ADSENSE_CLIENT so it never drifts from the ad units.
export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const publisherId = client?.replace(/^ca-/, "");

  const body = publisherId
    ? `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`
    : "";

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
