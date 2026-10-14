import { type NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// Blog post view counter. The client calls POST once per browser per day
// (see PostViews) and GET otherwise. Only the production deployment counts,
// so local dev and preview deploys never inflate the numbers.
const COUNTING = process.env.VERCEL_ENV === "production";

// Repeat readers get the count from Vercel's CDN, not a function call. A few
// minutes of lag on a view counter is fine.
const cached = { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400" };
const noStore = { "Cache-Control": "no-store" };

const notFound = (headers: Record<string, string>) =>
  Response.json({ error: "Not found" }, { status: 404, headers });

async function readViews(slug: string) {
  const post = await prisma.blogPost.findFirst({
    where: { slug, published: true },
    select: { views: true },
  });
  return post ? (post.views ?? 0) : null;
}

// One atomic round trip: increments and returns the new total. The pipeline
// form treats a missing or null count (older posts) as 0, which $inc can't.
async function incrementViews(slug: string) {
  const result = (await prisma.$runCommandRaw({
    findAndModify: "BlogPost",
    query: { slug, published: true },
    update: [{ $set: { views: { $add: [{ $ifNull: ["$views", 0] }, 1] } } }],
    new: true,
    fields: { views: 1 },
  })) as { value?: { views?: number } | null };
  return result.value ? (result.value.views ?? 0) : null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const views = await readViews(slug);
  if (views === null) return notFound(cached);
  return Response.json({ views }, { headers: cached });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const views = COUNTING ? await incrementViews(slug) : await readViews(slug);
  if (views === null) return notFound(noStore);
  return Response.json({ views }, { headers: noStore });
}
