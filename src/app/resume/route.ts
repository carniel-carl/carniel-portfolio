import { connection, type NextRequest } from "next/server";
import { getAbout } from "@/lib/data/portfolio";
import { RESUME_FILENAME } from "@/lib/site";

// Serves the resume from this site so downloads get a proper filename.
// Browsers ignore <a download="..."> for cross-origin files, so linking the
// UploadThing URL directly would name the file after its storage key.

const FALLBACK = "/chimezie-resume.pdf";

// Only proxy files from our own upload hosts (or this site)
const isAllowedHost = (host: string) =>
  host === "utfs.io" || host.endsWith(".ufs.sh");

export async function GET(request: NextRequest) {
  // Always resolve the current upload; never bake the file in at build time
  await connection();

  const about = await getAbout();
  const source = new URL(about?.resumeUrl || FALLBACK, request.nextUrl.origin);
  const sameOrigin = source.origin === request.nextUrl.origin;

  if (!sameOrigin && (source.protocol !== "https:" || !isAllowedHost(source.hostname))) {
    return new Response("Resume unavailable", { status: 404 });
  }

  const upstream = await fetch(source, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    return new Response("Resume unavailable", { status: 502 });
  }

  const encoded = encodeURIComponent(RESUME_FILENAME);
  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "application/pdf",
      ...(upstream.headers.get("content-length")
        ? { "Content-Length": upstream.headers.get("content-length")! }
        : {}),
      // Plain filename for older clients, UTF-8 form for everyone else
      "Content-Disposition": `attachment; filename="${RESUME_FILENAME}"; filename*=UTF-8''${encoded}`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
