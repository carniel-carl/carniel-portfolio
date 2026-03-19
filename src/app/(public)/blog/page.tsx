export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Chimezie's Portfolio",
  description: "Read my latest blog posts",
};

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
    },
  });

  if (posts.length === 0) {
    return (
      <div className="w-full min-h-[calc(100svh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 font-nunito">Blog</h1>
          <p className="text-muted-foreground text-lg">
            No posts yet. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[90%] max-w-4xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8 font-nunito">Blog</h1>
      <div className="grid gap-8 md:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group block"
          >
            <article className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              {post.coverImage && (
                <div className="relative w-full h-48">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2 group-hover:text-accent transition-colors">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
                {post.publishedAt && (
                  <time className="text-xs text-muted-foreground">
                    {new Date(post.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                )}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
