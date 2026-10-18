import type { Metadata } from "next";
import { AuthPortrait } from "@/components/admin/auth/AuthShell";
import VisitsCurve from "@/components/admin/dashboard/VisitsCurve";
import EmptyState from "@/components/admin/ui/EmptyState";
import RelativeTime from "@/components/admin/ui/RelativeTime";
import StatusPill from "@/components/admin/ui/StatusPill";
import { getAnalyticsData } from "@/lib/analytics-data";
import { auth } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";
import routes from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  EyeOff,
  FolderKanban,
  ListVideo,
  PenSquare,
  Pencil,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { cache, Suspense } from "react";

export const metadata: Metadata = { title: "Dashboard" };

const postSelect = {
  id: true,
  title: true,
  published: true,
  updatedAt: true,
  seriesOrder: true,
  category: { select: { name: true, color: true } },
  series: { select: { title: true } },
} as const;

const getDashboardData = async () => {
  "use cache";
  cacheTag(CACHE_TAGS.projects, CACHE_TAGS.skills, CACHE_TAGS.blog, CACHE_TAGS.social);
  cacheLife("max");

  const [
    projectCount,
    hiddenProjectCount,
    skillCount,
    postCount,
    publishedCount,
    socialLinks,
    drafts,
    recentlyEdited,
    mostRead,
    openSeries,
    featuredProjects,
  ] = await prisma.$transaction([
    prisma.project.count(),
    prisma.project.count({ where: { visible: false } }),
    prisma.skill.count(),
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { published: true } }),
    prisma.socialLink.findMany({ select: { link: true } }),
    prisma.blogPost.findMany({
      where: { published: false },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: postSelect,
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: postSelect,
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { views: "desc" },
      take: 5,
      select: { id: true, title: true, views: true },
    }),
    // "New episode" continues the series touched most recently
    prisma.series.findFirst({
      where: { completed: false },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    }),
    prisma.project.findMany({
      where: { featured: true },
      orderBy: { order: "asc" },
      take: 5,
      select: { id: true, name: true, tag: true, img: true, visible: true },
    }),
  ]);

  // Drafts first: they are the unfinished work
  const queue = [...drafts, ...recentlyEdited].slice(0, 5);

  return {
    projectCount,
    hiddenProjectCount,
    skillCount,
    postCount,
    publishedCount,
    socialConnected: socialLinks.filter((s) => s.link).length,
    socialTotal: socialLinks.length,
    queue: JSON.parse(JSON.stringify(queue)) as {
      id: string;
      title: string;
      published: boolean;
      updatedAt: string;
      seriesOrder: number | null;
      category: { name: string; color: string } | null;
      series: { title: string } | null;
    }[],
    mostRead: mostRead.map((p) => ({ ...p, views: p.views ?? 0 })),
    openSeries,
    featuredProjects,
  };
};

// Figure and curve sit in different places in the band; one fetch per request
const getPulse = cache(async () => {
  const data = await getAnalyticsData();
  const visits = data.dailyVisits;
  return {
    days: visits,
    total: visits.reduce((sum, d) => sum + d.count, 0),
    lastWeek: visits.slice(-7).reduce((sum, d) => sum + d.count, 0),
  };
});

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

async function Greeting() {
  const session = await auth();
  const first = session?.user?.name?.split(" ")[0];
  return <>{first ? `Welcome back, ${first}` : "Welcome back"}</>;
}

async function PulseFigure() {
  const { total, lastWeek } = await getPulse();
  return (
    <>
      <p className="tnum font-display text-6xl font-semibold leading-none tracking-[-0.04em] md:text-7xl">
        {total.toLocaleString()}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {total ? `${lastWeek.toLocaleString()} in the last 7 days` : "No visits recorded yet"}
      </p>
    </>
  );
}

async function PulseCurve() {
  const { days } = await getPulse();
  return (
    <VisitsCurve days={days} className="absolute inset-0" />
  );
}

export default async function AdminDashboard() {
  const data = await getDashboardData();
  const drafts = data.postCount - data.publishedCount;
  const nextDraft = data.queue.find((p) => !p.published);

  const inventory: { label: string; value: string | number; detail: string; href: string }[] = [
    {
      label: "Projects",
      value: data.projectCount,
      detail: data.hiddenProjectCount
        ? `${data.hiddenProjectCount} hidden from the site`
        : "All visible on the site",
      href: routes.admin.projects,
    },
    {
      label: "Blog posts",
      value: data.postCount,
      detail: `${data.publishedCount} live, ${plural(drafts, "draft")}`,
      href: routes.admin.blog,
    },
    {
      label: "Skills",
      value: data.skillCount,
      detail: "Shown in the skills grid",
      href: routes.admin.skills,
    },
    {
      label: "Social links",
      value: data.socialTotal ? `${data.socialConnected}/${data.socialTotal}` : 0,
      detail: data.socialTotal ? "Profiles connected" : "No profiles yet",
      href: routes.admin.social,
    },
  ];

  return (
    <div className="space-y-10">
      {/* The band: data-slot="page-header" gives it the full-bleed brand surface (admin.css) */}
      <header data-slot="page-header" className="!pb-[5rem]">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-center gap-5">
            <AuthPortrait className="size-14 ring-offset-[hsl(var(--brand-surface))] md:size-16" />
            <div className="min-w-0">
              <h1 className="text-balance font-display text-4xl font-semibold leading-[0.95] tracking-[-0.04em] md:text-5xl lg:text-[3.5rem]">
                <Suspense fallback="Welcome back">
                  <Greeting />
                </Suspense>
              </h1>
              <p className="mt-2.5 text-[15px] text-muted-foreground">
                {drafts
                  ? `${plural(drafts, "draft")} waiting for you.`
                  : "Everything is published. Start the next one."}
              </p>
            </div>
          </div>

          <div className="shrink-0 md:text-right">
            <p className="mb-2 text-[13px] font-medium text-muted-foreground">
              Site visits, last 30 days
            </p>
            <Suspense
              fallback={
                <>
                  <span className="block h-[3.75rem] w-40 animate-pulse rounded-lg bg-foreground/10 md:ml-auto md:h-[4.5rem]" />
                  <span className="mt-2 block h-4 w-32 animate-pulse rounded bg-foreground/10 md:ml-auto" />
                </>
              }
            >
              <PulseFigure />
            </Suspense>
            <Link
              href={routes.admin.analytics}
              className="mt-1 inline-block text-sm text-foreground underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Open analytics
            </Link>
          </div>
        </div>

        <nav aria-label="Create" className="mt-8 flex flex-wrap gap-2.5">
          <PillLink href={routes.admin.blogNew} icon={PenSquare} accent>
            Write a post
          </PillLink>
          <PillLink href={routes.admin.projectNew} icon={Plus}>
            New project
          </PillLink>
          {data.openSeries && (
            <PillLink
              href={routes.admin.blogNewInSeries(data.openSeries.id)}
              icon={ListVideo}
              title={`Next episode of ${data.openSeries.title}`}
            >
              New episode
            </PillLink>
          )}
        </nav>

        {/* The band's floor: its own zone, clear of the pills; the strip below covers the last 4.5rem of padding */}
        <div className="relative mt-6 h-32 md:h-40">
          <Suspense fallback={null}>
            <PulseCurve />
          </Suspense>
        </div>
      </header>

      {/* Rises over the band's lower edge */}
      <section aria-label="Inventory" className="surface grid grid-cols-2 md:grid-cols-4">
        {inventory.map(({ label, value, detail, href }, i) => (
          <Link
            key={label}
            href={href}
            className={cn(
              "relative p-4 transition-colors hover:bg-muted/60 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:p-6",
              i % 2 === 1 && "border-l",
              i >= 2 && "border-t md:border-t-0",
              i === 2 && "md:border-l",
              i === 0 && "rounded-tl-xl md:rounded-l-xl",
              i === 1 && "rounded-tr-xl md:rounded-none",
              i === 2 && "rounded-bl-xl md:rounded-none",
              i === 3 && "rounded-br-xl md:rounded-r-xl",
            )}
          >
            <span className="block text-[13px] font-medium text-muted-foreground">{label}</span>
            <span className="tnum mt-2 block font-display text-4xl font-semibold tracking-[-0.03em] text-foreground">
              {value}
            </span>
            <span className="mt-1 block text-[13px] text-muted-foreground">{detail}</span>
          </Link>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-labelledby="queue" className="surface min-w-0 p-2 md:p-3">
          <SheetHeading id="queue" href={routes.admin.blog} linkLabel="All posts">
            Pick up where you left off
          </SheetHeading>
          {data.queue.length === 0 ? (
            <EmptyState
              icon={PenSquare}
              title="No posts yet"
              description="Your first article will show up here once you save it."
              className="m-2 border-0 bg-muted/50"
            />
          ) : (
            <ul>
              {data.queue.map((post) => {
                const next = post.id === nextDraft?.id;
                return (
                  <li
                    key={post.id}
                    className="flex items-center gap-2 rounded-xl pr-3 transition-colors has-[a:hover]:bg-muted/60 md:pr-4"
                  >
                    <Link
                      href={routes.admin.blogPreview(post.id)}
                      className="flex min-w-0 flex-1 items-center gap-3.5 rounded-xl py-3 pl-3 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:pl-4"
                    >
                      <span
                        aria-hidden
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: post.category?.color ?? "#6b7280" }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-[15px] font-medium leading-snug text-foreground sm:line-clamp-1">
                          {post.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
                          <span className="sm:hidden">{post.published ? "Live" : "Draft"} · </span>
                          {"Edited "}
                          <RelativeTime date={post.updatedAt} />
                          {" · "}
                          {post.series
                            ? `${post.series.title}${post.seriesOrder ? `, part ${post.seriesOrder}` : ""}`
                            : (post.category?.name ?? "Others")}
                        </span>
                      </span>
                      <span className="hidden sm:contents">
                        <StatusPill published={post.published} />
                      </span>
                    </Link>
                    <Link
                      href={routes.admin.blogEdit(post.id)}
                      title={next ? "Continue writing" : "Edit"}
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-full transition-[transform,background-color,color,border-color] duration-300 ease-expo hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        next
                          ? "bg-accent text-accent-on"
                          : "border text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                      )}
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">
                        {next ? "Continue writing" : "Edit"} {post.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="most-read" className="surface min-w-0 p-2 md:p-3">
          <SheetHeading id="most-read" href={routes.admin.analytics} linkLabel="Analytics">
            Most read
          </SheetHeading>
          {data.mostRead.every((p) => p.views === 0) ? (
            <EmptyState
              compact
              icon={PenSquare}
              title="No reads yet"
              description="Views on published posts are counted here."
              className="m-2 border-0 bg-muted/50"
            />
          ) : (
            <ol>
              {data.mostRead.map((post, i) => (
                <li key={post.id}>
                  <Link
                    href={routes.admin.blogPreview(post.id)}
                    className="flex gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:px-4"
                  >
                    <span className="tnum w-3 pt-px text-[13px] text-muted-foreground">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-3">
                        <span className="line-clamp-2 min-w-0 flex-1 text-sm leading-snug text-foreground">
                          {post.title}
                        </span>
                        <span className="tnum text-[13px] text-muted-foreground">
                          {post.views.toLocaleString()}
                        </span>
                      </span>
                      <span
                        aria-hidden
                        className="admin-bar mt-2 block h-1 rounded-full bg-accent-ink opacity-70"
                        style={{ width: `${Math.max(4, (post.views / data.mostRead[0].views) * 100)}%` }}
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section aria-labelledby="featured" className="pt-2">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="featured" className="text-[15px] font-semibold text-foreground">
            On the home page
          </h2>
          <Link
            href={routes.admin.projects}
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Manage
          </Link>
        </div>
        {data.featuredProjects.length === 0 ? (
          <EmptyState
            compact
            icon={FolderKanban}
            title="Nothing featured"
            description="Mark a project as featured to put it on the home page."
          />
        ) : (
          <ol className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
            {data.featuredProjects.map((project) => (
              <li key={project.id} className="min-w-0">
                <Link
                  href={routes.admin.projectEdit(project.id)}
                  className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                >
                  <span className="relative block aspect-[16/10] overflow-hidden rounded-xl bg-muted shadow-[var(--shadow-surface)]">
                    {project.img && (
                      <Image
                        src={project.img}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 220px, 45vw"
                        className={cn(
                          "object-cover transition-transform duration-500 ease-expo group-hover:scale-[1.03]",
                          !project.visible && "opacity-50 grayscale",
                        )}
                      />
                    )}
                    {!project.visible && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-xs font-medium text-foreground">
                        <EyeOff className="size-3" />
                        Hidden
                      </span>
                    )}
                  </span>
                  <span className="mt-2.5 block truncate text-sm font-medium text-foreground">
                    {project.name}
                  </span>
                  {project.tag && (
                    <span className="block truncate text-[13px] text-muted-foreground">
                      {project.tag}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

/** The sign-in's pill: a label and an icon disc. One accent pill per screen. */
function PillLink({
  href,
  icon: Icon,
  accent,
  title,
  children,
}: {
  href: string;
  icon: LucideIcon;
  accent?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={title}
      className={cn(
        "group inline-flex h-12 items-center gap-3 rounded-full border p-1.5 pl-5 text-[15px] font-medium transition-[background-color,border-color,filter] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--brand-surface))]",
        accent
          ? "border-accent bg-accent text-accent-on shadow-[0_18px_44px_-22px_hsl(var(--accent)/0.6)] hover:brightness-110"
          : "border-foreground/15 bg-[hsl(var(--brand-surface))] text-foreground hover:border-foreground/30",
      )}
    >
      {children}
      <span
        className={cn(
          "grid size-9 place-items-center rounded-full transition-transform duration-300 ease-expo group-hover:rotate-[-8deg] group-hover:scale-105",
          accent ? "bg-accent-on text-accent" : "bg-foreground text-background",
        )}
      >
        <Icon className="size-4" />
      </span>
    </Link>
  );
}

function SheetHeading({
  id,
  href,
  linkLabel,
  children,
}: {
  id: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-3 pb-2 pt-3 md:px-4">
      <h2 id={id} className="text-[15px] font-semibold text-foreground">
        {children}
      </h2>
      <Link
        href={href}
        className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        {linkLabel}
      </Link>
    </div>
  );
}
