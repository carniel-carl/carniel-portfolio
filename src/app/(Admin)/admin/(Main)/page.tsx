import type { Metadata } from "next";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import EmptyState from "@/components/admin/ui/EmptyState";
import RelativeTime from "@/components/admin/ui/RelativeTime";
import StatusPill from "@/components/admin/ui/StatusPill";
import StatTile from "@/components/admin/ui/StatTile";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";
import routes from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  EyeOff,
  FolderKanban,
  PenSquare,
  Plus,
  Share2,
  Wrench,
} from "lucide-react";
import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Dashboard" };

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
    recentPosts,
    featuredProjects,
  ] = await prisma.$transaction([
    prisma.project.count(),
    prisma.project.count({ where: { visible: false } }),
    prisma.skill.count(),
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { published: true } }),
    prisma.socialLink.findMany({ select: { link: true } }),
    prisma.blogPost.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        published: true,
        updatedAt: true,
        category: { select: { name: true, color: true } },
      },
    }),
    prisma.project.findMany({
      where: { featured: true },
      orderBy: { order: "asc" },
      take: 5,
      select: { id: true, name: true, tag: true, img: true, visible: true },
    }),
  ]);

  return {
    projectCount,
    hiddenProjectCount,
    skillCount,
    postCount,
    publishedCount,
    socialConnected: socialLinks.filter((s) => s.link).length,
    socialTotal: socialLinks.length,
    recentPosts: JSON.parse(JSON.stringify(recentPosts)) as {
      id: string;
      title: string;
      published: boolean;
      updatedAt: string;
      category: { name: string; color: string } | null;
    }[],
    featuredProjects,
  };
};

async function Greeting() {
  const session = await auth();
  const first = session?.user?.name?.split(" ")[0];
  return (
    <AdminPageHeader
      title={first ? `Welcome back, ${first}` : "Welcome back"}
      description="Here is where your portfolio stands today."
      actions={
        <>
          <Link
            href={routes.admin.projectNew}
            className={cn(buttonVariants({ variant: "outline" }), "hover:bg-muted")}
          >
            <Plus />
            New project
          </Link>
          <Link href={routes.admin.blogNew} className={buttonVariants()}>
            <PenSquare />
            Write a post
          </Link>
        </>
      }
    />
  );
}

export default async function AdminDashboard() {
  const data = await getDashboardData();
  const drafts = data.postCount - data.publishedCount;

  return (
    <div className="space-y-10">
      <Suspense
        fallback={<AdminPageHeader title="Welcome back" description="Here is where your portfolio stands today." />}
      >
        <Greeting />
      </Suspense>

      <section aria-label="Totals" className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Projects"
          value={data.projectCount}
          icon={FolderKanban}
          href={routes.admin.projects}
          detail={
            data.hiddenProjectCount
              ? `${data.hiddenProjectCount} hidden from the site`
              : "All visible on the site"
          }
        />
        <StatTile
          label="Blog posts"
          value={data.postCount}
          icon={PenSquare}
          href={routes.admin.blog}
          detail={`${data.publishedCount} live, ${drafts} ${drafts === 1 ? "draft" : "drafts"}`}
        />
        <StatTile
          label="Skills"
          value={data.skillCount}
          icon={Wrench}
          href={routes.admin.skills}
          detail="Shown in the skills grid"
        />
        <StatTile
          label="Social links"
          value={`${data.socialConnected}/${data.socialTotal || 4}`}
          icon={Share2}
          href={routes.admin.social}
          detail="Profiles connected"
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section aria-labelledby="recent-posts" className="min-w-0">
          <SectionHeading id="recent-posts" href={routes.admin.blog} linkLabel="All posts">
            Recently edited posts
          </SectionHeading>
          {data.recentPosts.length === 0 ? (
            <EmptyState
              icon={PenSquare}
              title="No posts yet"
              description="Your first article will show up here once you save it."
              action={
                <Link href={routes.admin.blogNew} className={buttonVariants({ size: "sm" })}>
                  Write a post
                </Link>
              }
            />
          ) : (
            <ul className="surface divide-y">
              {data.recentPosts.map((post) => (
                <li key={post.id}>
                  <Link
                    href={routes.admin.blogEdit(post.id)}
                    className="group flex items-center gap-3 px-4 py-3 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                  >
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: post.category?.color ?? "#6b7280" }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {post.title}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {post.category?.name ?? "Others"} · edited <RelativeTime date={post.updatedAt} />
                      </span>
                    </span>
                    <StatusPill published={post.published} />
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="featured-projects" className="min-w-0">
          <SectionHeading id="featured-projects" href={routes.admin.projects} linkLabel="Manage">
            Featured lineup
          </SectionHeading>
          {data.featuredProjects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="Nothing featured"
              description="Mark a project as featured to put it on the home page."
            />
          ) : (
            <ol className="space-y-2">
              {data.featuredProjects.map((project, i) => (
                <li key={project.id}>
                  <Link
                    href={routes.admin.projectEdit(project.id)}
                    className="group flex items-center gap-3 rounded-xl p-1.5 pr-3 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                  >
                    <span className="tnum w-5 text-center text-xs text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="relative aspect-[16/10] w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
                      {project.img && (
                        <Image
                          src={project.img}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover transition-transform duration-500 ease-expo group-hover:scale-105"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{project.name}</span>
                      {project.tag && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {project.tag}
                        </span>
                      )}
                    </span>
                    {!project.visible && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <EyeOff className="size-3.5" />
                        Hidden
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

function SectionHeading({
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
    <div className="mb-3 flex items-center justify-between">
      <h2 id={id} className="text-sm font-semibold text-foreground">
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
