import { type NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// Blog post view counter. The client calls POST once per browser per day
// (see PostViews) and GET otherwise. Only the production deployment counts,
// so local dev and preview deploys never inflate the numbers.
const COUNTING = process.env.VERCEL_ENV === "production";

const noStore = { "Cache-Control": "no-store" };

async function readViews(slug: string) {
  const post = await prisma.blogPost.findFirst({
    where: { slug, published: true },
    select: { views: true },
  });
  return post ? (post.views ?? 0) : null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const views = await readViews(slug);
  if (views === null) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ views }, { headers: noStore });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (COUNTING) {
    // Older posts have no views field (or null), and $inc fails on null
    await prisma.blogPost.updateMany({
      where: {
        slug,
        published: true,
        OR: [{ views: null }, { views: { isSet: false } }],
      },
      data: { views: 0 },
    });
    await prisma.blogPost.updateMany({
      where: { slug, published: true },
      data: { views: { increment: 1 } },
    });
  }

  const views = await readViews(slug);
  if (views === null) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ views }, { headers: noStore });
}
