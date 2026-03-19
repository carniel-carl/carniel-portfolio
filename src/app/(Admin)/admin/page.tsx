import prisma from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FolderKanban, Wrench, PenSquare, Share2 } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const [projectCount, skillCount, postCount, publishedCount, socialCount] =
    await Promise.all([
      prisma.project.count(),
      prisma.skill.count(),
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { published: true } }),
      prisma.socialLink.count(),
    ]);

  const stats = [
    {
      title: "Projects",
      count: projectCount,
      icon: FolderKanban,
      href: "/admin/projects",
      description: "Manage your portfolio projects",
    },
    {
      title: "Skills",
      count: skillCount,
      icon: Wrench,
      href: "/admin/skills",
      description: "Manage your tech skills",
    },
    {
      title: "Blog Posts",
      count: postCount,
      icon: PenSquare,
      href: "/admin/blog",
      description: `${publishedCount} published, ${postCount - publishedCount} drafts`,
    },
    {
      title: "Social Links",
      count: socialCount,
      icon: Share2,
      href: "/admin/social",
      description: "Manage social media links",
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="size-4 text-muted-foreground" />
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
    </div>
  );
}
