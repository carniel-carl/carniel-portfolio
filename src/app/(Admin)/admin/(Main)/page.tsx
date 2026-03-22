import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardChart from "@/components/admin/DashboardChart";
import { CACHE_TAGS } from "@/lib/cache-tags";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { FolderKanban, PenSquare, Share2, Wrench } from "lucide-react";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";

const getAdminStats = async () => {
  "use cache";
  cacheTag(
    CACHE_TAGS.projects,
    CACHE_TAGS.skills,
    CACHE_TAGS.blog,
    CACHE_TAGS.social,
  );
  cacheLife("max");

  const [projectCount, skillCount, postCount, publishedCount, socialCount] =
    await prisma.$transaction([
      prisma.project.count(),
      prisma.skill.count(),
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { published: true } }),
      prisma.socialLink.count(),
    ]);

  return {
    projectCount,
    skillCount,
    postCount,
    publishedCount,
    socialCount,
  };
};

export default async function AdminDashboard() {
  const { projectCount, skillCount, postCount, publishedCount, socialCount } =
    await getAdminStats();

  const stats = [
    {
      title: "Projects",
      count: projectCount,
      icon: FolderKanban,
      href: "/admin/projects",
      description: "Manage your portfolio projects",
      iconColor: "bg-[#a78bfa]/10",
      textColor: "text-[#7c3aed]",
    },
    {
      title: "Skills",
      count: skillCount,
      icon: Wrench,
      href: "/admin/skills",
      description: "Manage your tech skills",
      iconColor: "bg-[#67e8f9]/10",
      textColor: "text-[#0891b2]",
    },
    {
      title: "Blog Posts",
      count: postCount,
      icon: PenSquare,
      href: "/admin/blog",
      description: `${publishedCount} published, ${postCount - publishedCount} drafts`,
      iconColor: "bg-[#fda4af]/10",
      textColor: "text-[#e11d48]",
    },
    {
      title: "Social Links",
      count: socialCount,
      icon: Share2,
      href: "/admin/social",
      description: "Manage social media links",
      iconColor: "bg-[#86efac]/10",
      textColor: "text-[#16a34a]",
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={cn("p-2 rounded-full", stat.iconColor)}>
                  <stat.icon className={cn("size-4", stat.textColor)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.count}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <DashboardChart
          data={{
            projectCount,
            skillCount,
            postCount,
            publishedCount,
            socialCount,
          }}
        />
      </div>
    </div>
  );
}
