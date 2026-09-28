import BlogCard from "@/components/blog/BlogCard";
import BlogPostContent from "@/components/blog/BlogPostContent";
import ScrollToTopOnEnter from "@/components/blog/ScrollToTopOnEnter";
import ReadingProgress from "@/components/blog/ReadingProgress";
import ShareBar from "@/components/blog/ShareBar";
import AuthorCard from "@/components/blog/AuthorCard";
import PostViews from "@/components/blog/PostViews";
import { JsonLdScript } from "@/components/seo/JsonLd";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getRecommendedPosts } from "@/lib/blog/recommendations";
import prisma from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageTracker from "@/components/analytics/PageTracker";
import AdSlot from "@/components/ads/AdSlot";
import { ADSENSE_BLOG_SIDEBAR_SLOT, ADSENSE_CLIENT } from "@/lib/adsense";
import { ViewTransition } from "react";
import { BLOG_BACK, blogPageTransition } from "@/lib/blog/view-transitions";
import {
  AUTHOR_NAME,
  BASE_OPEN_GRAPH,
  SITE_URL,
  toMetaDescription,
} from "@/lib/site";

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

  // Drafts 404 on the page, so keep them (and missing posts) out of the index too
  if (!post || !post.published) {
    return { title: "Post not found", robots: { index: false, follow: false } };
  }

  const url = `/blog/${post.slug}`;
  const description = post.excerpt?.trim() || toMetaDescription(post.content);
  const authorName = AUTHOR_NAME;
  // The cover is already a 1200x630 share card on a CDN, so crawlers get it
  // instantly. Posts without one use a static copy of the generic /blog card
  const images = [
    post.coverImage
      ? { url: post.coverImage, alt: post.title }
      : { url: "/images/og/blog.png", width: 1200, height: 630, alt: "Writing by Carniel" },
  ];

  return {
    title: post.title,
    description,
    keywords: post.tags.length > 0 ? post.tags : undefined,
    authors: [{ name: authorName }],
    category: post.category?.name,
    alternates: {
      canonical: url,
      types: { "application/rss+xml": [{ url: "/feed.xml", title: "Writing · Chimezie Carniel" }] },
    },
    openGraph: {
      ...BASE_OPEN_GRAPH,
      type: "article",
      url,
      title: post.title,
      description,
      publishedTime: (post.publishedAt ?? post.createdAt).toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [authorName],
      section: post.category?.name,
      tags: post.tags,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { "max-image-preview": "large", "max-snippet": -1 },
    },
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

  const relatedPosts = await getRecommendedPosts(post.id);

  const showAds = Boolean(ADSENSE_CLIENT && ADSENSE_BLOG_SIDEBAR_SLOT);
  const estimatedReadTime = `${Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200))} min`;

  const postUrl = `${SITE_URL}/blog/${post.slug}`;
  // BlogPosting structured data makes the post eligible for article rich results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt?.trim() || toMetaDescription(post.content),
    image: post.coverImage ? [post.coverImage] : undefined,
    datePublished: (post.publishedAt ?? post.createdAt).toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: AUTHOR_NAME, url: SITE_URL },
    publisher: { "@type": "Person", name: AUTHOR_NAME, url: SITE_URL },
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    url: postUrl,
    articleSection: post.category?.name,
    keywords: post.tags.length > 0 ? post.tags.join(", ") : undefined,
    wordCount: toMetaDescription(post.content, Infinity).split(" ").length,
  };

  const articleFooter = (
    <>
      <div className="mt-10">
        <ShareBar url={postUrl} title={post.title} />
      </div>
      <AuthorCard />
    </>
  );

  return (
    <ViewTransition
      enter={blogPageTransition}
      exit={blogPageTransition}
      default="none"
    >
      <div>
        <ScrollToTopOnEnter />
        <ReadingProgress targetId="post-article" />
        <JsonLdScript data={jsonLd} />
        <PageTracker
          event="Blog Post Viewed"
          properties={{
            slug,
            title: post.title,
            category: post.category?.name,
            estimated_read_time: estimatedReadTime,
          }}
        />
        <div
          className={
            showAds
              ? "mx-auto w-[90%] max-w-3xl pt-8 md:pt-10"
              : "mx-auto w-[90%] max-w-[68rem] pt-8 md:pt-10"
          }
        >
          <Link
            href="/blog"
            transitionTypes={[BLOG_BACK]}
            className="group inline-flex h-10 items-center gap-2 rounded-full border border-foreground/15 pl-3 pr-4 text-sm font-medium text-foreground/75 transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            All posts
          </Link>
        </div>

        {showAds ? (
          <>
            {/* Plain <script>: AdSense rejects next/script's data-nscript
              attribute. React hoists async scripts to <head> and loads them once. */}
            <script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
              crossOrigin="anonymous"
            />

            {/* Ad rails flank the article on wide screens; below xl it's content only */}
            <div className="xl:grid xl:grid-cols-[160px_minmax(0,48rem)_160px] xl:justify-center xl:gap-10 2xl:grid-cols-[300px_minmax(0,48rem)_300px]">
              <aside aria-label="Advertisement" className="hidden xl:block">
                <div className="sticky top-24 pt-12">
                  <AdSlot key={`left-${slug}`} slot={ADSENSE_BLOG_SIDEBAR_SLOT} />
                </div>
              </aside>

              <BlogPostContent post={post} layout="inline" footer={articleFooter} meta={<PostViews slug={post.slug} />} />

              <aside aria-label="Advertisement" className="hidden xl:block">
                <div className="sticky top-24 pt-12">
                  <AdSlot key={`right-${slug}`} slot={ADSENSE_BLOG_SIDEBAR_SLOT} />
                </div>
              </aside>
            </div>
          </>
        ) : (
          <BlogPostContent post={post} layout="rail" footer={articleFooter} meta={<PostViews slug={post.slug} />} />
        )}

        {relatedPosts.length > 0 && (
          <section className="mx-auto mt-8 w-[90%] max-w-[68rem] border-t border-foreground/10 py-16 md:py-24">
            <h2 className="mb-10 font-display text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.04em] [font-stretch:75%] md:mb-14">
              Keep reading
            </h2>
            <div className="grid gap-x-6 gap-y-14 md:grid-cols-2">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </section>
        )}
      </div>
    </ViewTransition>
  );
}
