import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const words = q.split(/\s+/).filter(Boolean);

  const posts = await prisma.blogPost.findMany({
    where: {
      published: true,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { excerpt: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
        { tags: { hasSome: words } },
        { category: { name: { contains: q, mode: "insensitive" } } },
        ...words.map((word) => ({
          title: { contains: word, mode: "insensitive" as const },
        })),
      ],
    },
    orderBy: { publishedAt: "desc" },
    take: 8,
    select: {
      title: true,
      slug: true,
      excerpt: true,
      tags: true,
      category: { select: { name: true, color: true } },
    },
  });

  return NextResponse.json({ results: posts });
}
