import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LocationChart,
  RegionChart,
  TopBlogPostsChart,
  TopProjectsChart,
} from "@/components/admin/AnalyticsCharts";
import {
  getEventCounts,
  getPortfolioLocations,
  getLocationsByRegion,
  getTopBlogPosts,
  getTopProjects,
  getDateRange,
} from "@/lib/mixpanel-server";
import { cacheLife } from "next/cache";
import {
  Eye,
  FileText,
  Download,
  Share2,
  BookOpen,
  LayoutGrid,
  FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";

async function getAnalyticsData() {
  "use cache";
  cacheLife("hours");

  const { from_date, to_date } = getDateRange(30);

  const [eventCounts, locations, regions, topPosts, topProjects] =
    await Promise.all([
      getEventCounts(from_date, to_date),
      getPortfolioLocations(from_date, to_date),
      getLocationsByRegion(from_date, to_date),
      getTopBlogPosts(from_date, to_date),
      getTopProjects(from_date, to_date),
    ]);

  return { eventCounts, locations, regions, topPosts, topProjects };
}

const eventToIcon: Record<string, { icon: typeof Eye; color: string; bg: string }> = {
  "Portfolio Viewed": {
    icon: Eye,
    color: "text-[#7c3aed]",
    bg: "bg-[#a78bfa]/10",
  },
  "Blog Page Viewed": {
    icon: BookOpen,
    color: "text-[#0891b2]",
    bg: "bg-[#67e8f9]/10",
  },
  "Blog Post Viewed": {
    icon: FileText,
    color: "text-[#e11d48]",
    bg: "bg-[#fda4af]/10",
  },
  "Blog Category Viewed": {
    icon: LayoutGrid,
    color: "text-[#ea580c]",
    bg: "bg-[#fdba74]/10",
  },
  "Resume Downloaded": {
    icon: Download,
    color: "text-[#16a34a]",
    bg: "bg-[#86efac]/10",
  },
  "Social Link Clicked": {
    icon: Share2,
    color: "text-[#2563eb]",
    bg: "bg-[#93c5fd]/10",
  },
  "Project Link Clicked": {
    icon: FolderKanban,
    color: "text-[#d97706]",
    bg: "bg-[#fcd34d]/10",
  },
};

export default async function AnalyticsPage() {
  const { eventCounts, locations, regions, topPosts, topProjects } =
    await getAnalyticsData();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Analytics</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Last 30 days — cached hourly
      </p>

      {/* Overview cards */}
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(200px,1fr))] mb-8">
        {eventCounts.map((item) => {
          const meta = eventToIcon[item.event] || {
            icon: Eye,
            color: "text-foreground",
            bg: "bg-muted",
          };
          const Icon = meta.icon;
          return (
            <Card key={item.event}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {item.event}
                </CardTitle>
                <div className={cn("p-2 rounded-full", meta.bg)}>
                  <Icon className={cn("size-4", meta.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <LocationChart data={locations} />
        <RegionChart data={regions} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopBlogPostsChart data={topPosts} />
        <TopProjectsChart data={topProjects} />
      </div>
    </div>
  );
}
