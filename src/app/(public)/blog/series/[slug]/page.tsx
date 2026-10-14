import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ViewTransition } from "react";
import { ArrowLeft } from "lucide-react";
import PageTracker from "@/components/analytics/PageTracker";
import AudiencePrompt from "@/components/kids/AudiencePrompt";
import KidsBadge from "@/components/kids/KidsBadge";
import SeriesEpisodeList from "@/components/blog/series/SeriesEpisodeList";
import SeriesProgressCta from "@/components/blog/series/SeriesProgressCta";
import { JsonLdScript } from "@/components/seo/JsonLd";
import { formatMinutes } from "@/lib/blog/article";
import { levelRange } from "@/lib/blog/levels";
import { getPublishedSeries, getSeriesList } from "@/lib/blog/series";
import { BLOG_BACK, blogPageTransition } from "@/lib/blog/view-transitions";
import routes from "@/lib/routes";
import { AUTHOR_NAME, BASE_OPEN_GRAPH, ogImage, SITE_URL } from "@/lib/site";

export async function generateStaticParams() {
  const series = await getSeriesList();
  if (!series.length) return [{ slug: "__placeholder__" }];
  return series.map((s) => ({ slug: s.slug }));
}

const describe = (series: { title: string; description: string | null; episodes: unknown[] }) =>
  series.description?.trim() ||
  `${series.title}: a ${series.episodes.length}-part series by ${AUTHOR_NAME}, read in order.`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const series = await getPublishedSeries({ slug });
  if (!series) return { title: "Series not found", robots: { index: false, follow: false } };

  const url = routes.public.series(series.slug);
  const description = describe(series);
  const images = [
    series.coverImage
      ? { url: series.coverImage, alt: series.title }
      : ogImage("/images/og/blog.png", "Writing by Carniel"),
  ];

  return {
    title: `${series.title} · Series`,
    description,
    alternates: { canonical: url },
    openGraph: { ...BASE_OPEN_GRAPH, url, title: series.title, description, images },
    twitter: { card: "summary_large_image", title: series.title, description, images },
  };
}

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const series = await getPublishedSeries({ slug });
  if (!series) notFound();

  const { episodes } = series;
  const totalMinutes = episodes.reduce((sum, e) => sum + e.readingMinutes, 0);
  const levels = levelRange(episodes.map((e) => e.level));
  const seriesUrl = `${SITE_URL}${routes.public.series(series.slug)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWorkSeries",
    name: series.title,
    description: describe(series),
    url: seriesUrl,
    image: series.coverImage ? [series.coverImage] : undefined,
    author: { "@type": "Person", name: AUTHOR_NAME, url: SITE_URL },
    hasPart: episodes.map((e) => ({
      "@type": "BlogPosting",
      headline: e.title,
      url: `${SITE_URL}${routes.public.blogPost(e.slug)}`,
      position: e.number,
    })),
  };

  return (
    <ViewTransition enter={blogPageTransition} exit={blogPageTransition} default="none">
      <div className="mx-auto w-[90%] max-w-[68rem] pb-24 pt-8 md:pb-32 md:pt-10">
        <JsonLdScript data={jsonLd} />
        <PageTracker event="Blog Series Viewed" properties={{ series: series.slug }} />
        {series.forKids && <AudiencePrompt />}

        <Link
          href={routes.public.blogSeries}
          transitionTypes={[BLOG_BACK]}
          className="group inline-flex h-10 items-center gap-2 rounded-full border border-foreground/15 pl-3 pr-4 text-sm font-medium text-foreground/75 transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
          All series
        </Link>

        <header className="mt-10 grid gap-10 md:mt-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end lg:gap-16">
          <div className="flex flex-col gap-6">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/55">
              <span className="text-accent-ink dark:text-accent">Series</span>
              <span>{series.completed ? "Complete" : "Ongoing, more episodes coming"}</span>
              {series.forKids && <KidsBadge />}
            </p>
            <h1 className="text-balance font-display text-[clamp(2.6rem,7vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.04em]">
              {series.title}
            </h1>
            {series.description?.trim() && (
              <p className="max-w-[58ch] text-lg leading-relaxed text-foreground/70 md:text-xl">
                {series.description}
              </p>
            )}
            <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <div>
                <dt className="text-foreground/55">Episodes</dt>
                <dd className="tnum font-medium">{episodes.length}</dd>
              </div>
              <div>
                <dt className="text-foreground/55">Reading time</dt>
                <dd className="tnum font-medium">{formatMinutes(totalMinutes)}</dd>
              </div>
              {levels && (
                <div>
                  <dt className="text-foreground/55">Level</dt>
                  <dd className="font-medium">{levels}</dd>
                </div>
              )}
            </dl>
          </div>

          <SeriesProgressCta
            seriesSlug={series.slug}
            episodes={episodes.map(({ slug, title, number }) => ({ slug, title, number }))}
          />
        </header>

        {series.coverImage && (
          <div className="relative mt-12 aspect-[16/7] w-full overflow-hidden rounded-[1.25rem] bg-surface md:mt-16">
            <Image
              src={series.coverImage}
              alt=""
              fill
              sizes="(max-width: 1100px) 90vw, 68rem"
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="mt-16 md:mt-20">
          <SeriesEpisodeList
            seriesSlug={series.slug}
            episodes={episodes.map(({ slug, title, excerpt, level, number, readingMinutes }) => ({
              slug,
              title,
              excerpt,
              level,
              number,
              readingMinutes,
            }))}
          />
        </div>
      </div>
    </ViewTransition>
  );
}
