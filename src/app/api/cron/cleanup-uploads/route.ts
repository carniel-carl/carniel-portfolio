import { type NextRequest } from "next/server";
import { UTApi } from "uploadthing/server";
import prisma from "@/lib/prisma";

// Deletes UploadThing files that nothing in the database points to.
// Runs monthly via Vercel Cron (vercel.json). Add ?dryRun=1 to preview
// what would be removed without deleting anything.

export const maxDuration = 60;

// Skip recent uploads: the admin forms upload before the record is saved,
// so a file can be briefly unreferenced while someone is still editing.
const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 500;

const utapi = new UTApi();

// Every place an upload URL can live, flattened into one searchable string.
// File keys are long random strings, so a substring match is reliable and
// catches URLs in any form (utfs.io, *.ufs.sh, inside post HTML, ...).
async function collectReferences() {
  const [about, projects, posts, socials] = await Promise.all([
    prisma.about.findMany(),
    prisma.project.findMany(),
    prisma.blogPost.findMany({ select: { coverImage: true, content: true } }),
    prisma.socialLink.findMany(),
  ]);
  return JSON.stringify([about, projects, posts, socials]);
}

async function listAllFiles() {
  const files = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await utapi.listFiles({ limit: PAGE_SIZE, offset });
    files.push(...page.files);
    if (!page.hasMore) return files;
  }
}

export async function GET(request: NextRequest) {
  // Vercel Cron sends this header automatically when CRON_SECRET is set
  if (
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.has("dryRun");
  const [references, files] = await Promise.all([
    collectReferences(),
    listAllFiles(),
  ]);

  // An empty result almost certainly means a bad DB read, not an unused bucket
  if (files.length > 0 && !references.match(/utfs\.io|ufs\.sh/)) {
    return Response.json(
      { error: "No upload references found; aborting" },
      { status: 500 },
    );
  }

  const cutoff = Date.now() - GRACE_PERIOD_MS;
  const orphans = files.filter(
    (file) =>
      (file.status === "Uploaded" || file.status === "Failed") &&
      file.uploadedAt < cutoff &&
      !references.includes(file.key),
  );

  if (!dryRun && orphans.length > 0) {
    await utapi.deleteFiles(orphans.map((file) => file.key));
  }

  return Response.json({
    dryRun,
    scanned: files.length,
    deleted: dryRun ? 0 : orphans.length,
    freedBytes: orphans.reduce((sum, file) => sum + file.size, 0),
    files: orphans.map(({ key, name, size }) => ({ key, name, size })),
  });
}
