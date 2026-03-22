import BlogCard from "@/components/blog/BlogCard";
import BlogPostContent from "@/components/blog/BlogPostContent";
import { CACHE_TAGS } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageTracker from "@/components/analytics/PageTracker";

async function getPost(slug: string) {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  return prisma.blogPost.findUnique({
    where: { slug },
    include: {
      category: { select: { name: true, slug: true, color: true } },
      author: { select: { name: true } },
    },
  });
}

async function getRelatedPosts(
  postId: string,
  categoryId: string | null,
  tags: string[],
) {
  "use cache";
  cacheTag(CACHE_TAGS.blog);
  cacheLife("max");

  const orConditions = [];
  if (categoryId) orConditions.push({ categoryId });
  if (tags.length > 0) orConditions.push({ tags: { hasSome: tags } });

  if (orConditions.length === 0) return [];

  return prisma.blogPost.findMany({
    where: {
      published: true,
      id: { not: postId },
      OR: orConditions,
    },
    orderBy: { publishedAt: "desc" },
    take: 4,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      tags: true,
      category: { select: { name: true, slug: true, color: true } },
      author: { select: { name: true } },
    },
  });
}

export async function generateStaticParams() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { slug: true },
  });

  if (!posts.length) return [{ slug: "__placeholder__" }];

  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title} | Blog`,
    description: post.excerpt || post.title,
    keywords: post.tags.length > 0 ? post.tags : undefined,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post || !post.published) notFound();

  const relatedPosts = await getRelatedPosts(
    post.id,
    post.categoryId,
    post.tags,
  );

  const estimatedReadTime = `${Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200))} min`;

  return (
    <div>
      <PageTracker
        event="Blog Post Viewed"
        properties={{
          slug,
          title: post.title,
          category: post.category?.name,
          estimated_read_time: estimatedReadTime,
        }}
      />
      <div className="w-[90%] max-w-3xl mx-auto pt-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Blog
        </Link>
      </div>

      <BlogPostContent post={post} />

      {relatedPosts.length > 0 && (
        <section className="w-[90%] max-w-4xl mx-auto py-12 border-t mt-12">
          <h2 className="text-2xl font-bold mb-6 font-nunito">Related Posts</h2>
          <div className="grid gap-8 md:grid-cols-2">
            {relatedPosts.map((relatedPost) => (
              <BlogCard key={relatedPost.id} post={relatedPost} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
