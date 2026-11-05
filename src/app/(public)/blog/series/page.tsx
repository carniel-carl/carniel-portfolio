import Link from "next/link";
import type { Metadata } from "next";
import { ViewTransition } from "react";
import { ArrowLeft } from "lucide-react";
import PageTracker from "@/components/analytics/PageTracker";
import SeriesCard from "@/components/blog/series/SeriesCard";
import { getSeriesList } from "@/lib/blog/series";
import { BLOG_BACK, blogPageTransition } from "@/lib/blog/view-transitions";
import routes from "@/lib/routes";
import { BASE_OPEN_GRAPH, ogImage, SITE_NAME } from "@/lib/site";

const DESCRIPTION =
  "Step-by-step series that take one topic from the basics to advanced, one episode at a time.";

export const metadata: Metadata = {
  title: "Series",
  description: DESCRIPTION,
  alternates: { canonical: routes.public.blogSeries },
  openGraph: {
    ...BASE_OPEN_GRAPH,
    url: routes.public.blogSeries,
    title: `Series · ${SITE_NAME}`,
    description: DESCRIPTION,
    images: [ogImage("/images/og/blog.png", "Writing by Carniel")],
  },
};

export default async function SeriesIndexPage() {
  const series = await getSeriesList();

  return (
    <ViewTransition enter={blogPageTransition} exit={blogPageTransition} default="none">
      <div className="mx-auto max-w-[1400px] px-4 pb-24 pt-10 md:px-8 md:pb-32 md:pt-16">
        <PageTracker event="Blog Series Index Viewed" />
        <Link
          href={routes.public.blog}
          transitionTypes={[BLOG_BACK]}
          className="group inline-flex h-10 items-center gap-2 rounded-full border border-foreground/15 pl-3 pr-4 text-sm font-medium text-foreground/75 transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
          All posts
        </Link>

        <header className="mb-12 mt-10 flex flex-col gap-6 md:mb-16">
          <h1 className="font-display text-[clamp(3.5rem,11vw,9rem)] font-semibold leading-[0.88] tracking-[-0.045em]">
            Series
          </h1>
          <p className="max-w-[48ch] text-lg text-foreground/70 md:text-xl">{DESCRIPTION}</p>
        </header>

        {series.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-[1.25rem] border border-dashed border-foreground/20 px-6 py-24 text-center">
            <p className="font-display text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
              The first series is on the way
            </p>
            <p className="text-lg text-foreground/60">
              Meanwhile, the{" "}
              <Link href={routes.public.blog} className="underline underline-offset-4">
                blog
              </Link>{" "}
              has plenty to read.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {series.map((s) => (
              <SeriesCard key={s.id} series={s} />
            ))}
          </div>
        )}
      </div>
    </ViewTransition>
  );
}
