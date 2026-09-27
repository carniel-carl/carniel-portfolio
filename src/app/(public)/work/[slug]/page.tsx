import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import PageTracker from "@/components/analytics/PageTracker";
import TableOfContents from "@/components/blog/TableOfContents";
import { renderRichText, sanitizeRichText } from "@/components/content/RichText";
import PhoneShowcase from "@/components/general/PhoneShowcase";
import { JsonLdScript } from "@/components/seo/JsonLd";
import { withHeadingAnchors } from "@/lib/blog/article";
import { blogPageTransition } from "@/lib/blog/view-transitions";
import {
  getProjectBySlug,
  getProjectSlugs,
  toProjectData,
} from "@/lib/data/portfolio";
import { projectCoverName } from "@/lib/projects/view-transitions";
import routes from "@/lib/routes";
import { BASE_OPEN_GRAPH, SITE_NAME, SITE_URL } from "@/lib/site";
import ProjectLinks from "@/sections/projects/ProjectLinks";
import { ProjectBadges, isMobileProject } from "@/sections/projects/ProjectMeta";

const PLATFORM_LABEL = { web: "Web", mobile: "Mobile app", both: "Web + mobile" };
const STATUS_LABEL = {
  live: "Live",
  beta: "In beta",
  prototype: "Prototype",
  internal: "Internal (NDA)",
  "in-development": "In development",
};

// Case studies need a few sections before a contents list earns its space
const TOC_MIN_HEADINGS = 3;

export async function generateStaticParams() {
  const projects = await getProjectSlugs();
  if (!projects.length) return [{ slug: "__placeholder__" }];
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = await getProjectBySlug(slug);
  if (!found) return { title: "Project not found" };

  const { project } = found;
  const url = routes.public.work(project.slug);
  return {
    title: `${project.name} · Case study`,
    description: project.description,
    alternates: { canonical: url },
    openGraph: {
      ...BASE_OPEN_GRAPH,
      type: "article",
      url,
      title: `${project.name} · ${SITE_NAME}`,
      description: project.description,
    },
  };
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = await getProjectBySlug(slug);
  if (!found) notFound();

  const record = found.project;
  const project = toProjectData(record);
  const next = found.next ? toProjectData(found.next) : null;

  const phone =
    isMobileProject(project) && Boolean(project.videoUrl || project.screenshots?.length);
  const highlights = (project.highlights ?? []).filter(Boolean);
  const screenshots = (project.screenshots ?? []).filter(Boolean);

  const story = record.caseStudy?.trim()
    ? withHeadingAnchors(sanitizeRichText(record.caseStudy))
    : null;
  const showToc = Boolean(story && story.toc.length >= TOC_MIN_HEADINGS);

  const facts = [
    { label: "Role", value: project.role },
    { label: "Team", value: project.team },
    { label: "Platform", value: PLATFORM_LABEL[project.platform ?? "web"] },
    { label: "Status", value: project.status && STATUS_LABEL[project.status] },
  ].filter((f): f is { label: string; value: string } => Boolean(f.value));

  const pageUrl = `${SITE_URL}${routes.public.work(project.slug)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.name,
    description: project.description,
    url: pageUrl,
    image: project.img ? new URL(project.img, SITE_URL).toString() : undefined,
    creator: { "@id": `${SITE_URL}/#person` },
    keywords: project.stack?.join(", ") || undefined,
    dateModified: record.updatedAt.toISOString(),
  };

  return (
    <ViewTransition enter={blogPageTransition} exit={blogPageTransition} default="none">
      <article className="mx-auto max-w-[1400px] px-4 pb-8 pt-8 md:px-8 md:pt-10">
        <JsonLdScript data={jsonLd} />
        <PageTracker
          event="Case Study Viewed"
          properties={{ project: project.name, has_case_study: Boolean(story) }}
        />

        <Link
          href={`${routes.public.portfolio}#projects`}
          className="group inline-flex h-10 items-center gap-2 rounded-full border border-foreground/15 pl-3 pr-4 text-sm font-medium text-foreground/75 transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
          All work
        </Link>

        {/* SUB: Title block + facts */}
        <header className="mt-12 grid gap-12 md:mt-16 md:grid-cols-12 md:gap-8">
          <div className="flex flex-col gap-6 md:col-span-8">
            <div className="flex flex-wrap items-center gap-3">
              {project.tag && (
                <span className="text-sm font-medium text-accent-ink">{project.tag}</span>
              )}
              <ProjectBadges project={project} />
            </div>
            <h1 className="text-balance font-display text-[clamp(3.25rem,9vw,8.5rem)] font-semibold leading-[0.88] tracking-[-0.045em] [font-stretch:75%]">
              {project.name}
            </h1>
            <p className="max-w-[52ch] text-pretty text-lg leading-relaxed text-foreground/70 md:text-xl">
              {project.description}
            </p>
          </div>

          <div className="flex flex-col gap-8 md:col-span-4 md:self-end">
            {facts.length > 0 && (
              <dl className="border-t border-foreground/10">
                {facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="grid grid-cols-[6.5rem_1fr] gap-4 border-b border-foreground/10 py-3.5 text-sm md:text-base"
                  >
                    <dt className="font-mono text-xs uppercase tracking-[0.12em] text-foreground/50 md:text-[0.8rem] md:leading-6">
                      {fact.label}
                    </dt>
                    <dd className="text-foreground/85">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <ProjectLinks project={project} showCaseStudy={false} />
          </div>
        </header>

        {/* SUB: Hero media, morphs from the project card */}
        <ViewTransition name={projectCoverName(project.slug)} share="vt-morph">
          {phone ? (
            <div className="relative mt-14 flex h-[34rem] items-center justify-center overflow-hidden rounded-[1.25rem] bg-surface bg-[radial-gradient(55%_55%_at_50%_45%,color-mix(in_srgb,var(--clr)_22%,transparent),transparent_75%)] py-10 md:mt-20 md:h-[44rem]">
              <PhoneShowcase
                name={project.name}
                videoUrl={project.videoUrl}
                posterUrl={project.posterUrl}
                screenshots={project.screenshots}
                fallbackImage={project.img}
                className="h-full"
              />
            </div>
          ) : (
            project.img && (
              <div className="relative mt-14 aspect-[16/9] overflow-hidden rounded-[1.25rem] bg-surface md:mt-20">
                <Image
                  src={project.img}
                  alt={project.name}
                  fill
                  priority
                  sizes="(max-width: 1400px) 100vw, 1400px"
                  className="object-cover object-top"
                />
              </div>
            )
          )}
        </ViewTransition>

        {/* SUB: What I built */}
        {highlights.length > 0 && (
          <section className="mt-24 grid gap-8 md:mt-36 md:grid-cols-12">
            <h2 className="font-display text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.04em] [font-stretch:75%] md:col-span-4">
              What I built
            </h2>
            <ol className="md:col-span-8">
              {highlights.map((item, i) => (
                <li
                  key={item}
                  className="grid grid-cols-[3rem_1fr] gap-4 border-t border-foreground/10 py-6 text-lg leading-relaxed text-foreground/85 last:border-b md:text-xl"
                >
                  <span className="font-mono text-sm leading-8 text-accent-ink">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* SUB: Case study body */}
        {story && (
          <section className="mt-24 grid gap-10 md:mt-36 md:grid-cols-12 md:gap-8">
            <aside className="md:col-span-4">
              <div className="md:sticky md:top-28">
                <h2 className="font-display text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.04em] [font-stretch:75%]">
                  The story
                </h2>
                {showToc && (
                  <div className="mt-8 hidden md:block">
                    <TableOfContents items={story.toc} variant="rail" />
                  </div>
                )}
              </div>
            </aside>
            <div className="min-w-0 md:col-span-8">
              <div className="tiptap-content max-w-3xl">{renderRichText(story.html)}</div>
            </div>
          </section>
        )}

        {/* SUB: Stack */}
        {project.stack && project.stack.length > 0 && (
          <section className="mt-24 grid gap-8 md:mt-36 md:grid-cols-12">
            <h2 className="font-display text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.04em] [font-stretch:75%] md:col-span-4">
              Built with
            </h2>
            <ul className="flex flex-wrap content-start gap-2.5 md:col-span-8">
              {project.stack.map((item, i) => (
                <li
                  key={`${item}-${i}`}
                  className="rounded-full border border-foreground/15 px-4 py-2 text-sm capitalize text-foreground/85 md:text-base"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* SUB: Screens (mobile apps; the hero only cycles through them) */}
        {phone && screenshots.length > 1 && (
          <section className="mt-24 grid gap-8 md:mt-36 md:grid-cols-12">
            <h2 className="font-display text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.04em] [font-stretch:75%] md:col-span-4">
              Screens
            </h2>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:col-span-8 lg:grid-cols-4">
              {screenshots.map((src, i) => (
                <li
                  key={src}
                  className="relative aspect-[9/19.5] overflow-hidden rounded-[1.25rem] border border-foreground/10 bg-surface"
                >
                  <Image
                    src={src}
                    alt={`${project.name} screen ${i + 1}`}
                    fill
                    loading="lazy"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 15vw"
                    className="object-cover object-top"
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* SUB: Next project */}
        {next && (
          <Link
            href={routes.public.work(next.slug)}
            className="group mt-28 grid gap-8 border-t border-foreground/10 pt-10 md:mt-40 md:grid-cols-12 md:items-end md:pt-14"
          >
            <div className="flex flex-col gap-4 md:col-span-8">
              <span className="font-mono text-sm uppercase tracking-[0.14em] text-foreground/55">
                Next project
              </span>
              <span className="font-display text-[clamp(3rem,8vw,7.5rem)] font-semibold leading-[0.9] tracking-[-0.045em] transition-transform duration-700 ease-expo [font-stretch:75%] group-hover:translate-x-3">
                {next.name}
              </span>
            </div>
            <div className="flex items-end justify-between gap-6 md:col-span-4">
              {next.img && (
                <div className="relative aspect-[16/10] w-full max-w-[18rem] overflow-hidden rounded-[1rem] bg-surface">
                  <Image
                    src={next.img}
                    alt=""
                    fill
                    loading="lazy"
                    sizes="18rem"
                    className="object-cover object-top transition-transform duration-[1.2s] ease-expo group-hover:scale-[1.05]"
                  />
                </div>
              )}
              <span className="grid size-14 shrink-0 place-items-center rounded-full border border-foreground/15 transition-[transform,background-color,color,border-color] duration-500 ease-expo group-hover:rotate-45 group-hover:border-transparent group-hover:bg-accent group-hover:text-accent-on">
                <ArrowUpRight className="size-5" />
              </span>
            </div>
          </Link>
        )}
      </article>
    </ViewTransition>
  );
}
