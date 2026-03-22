"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type LocationData = { country: string; region: string; count: number };
type BlogPostData = { slug: string; title: string; count: number };
type ProjectClickData = {
  project: string;
  live_clicks: number;
  code_clicks: number;
  total: number;
};

const locationChartConfig = {
  count: { label: "Views", color: "#7c3aed" },
} satisfies ChartConfig;

const blogChartConfig = {
  count: { label: "Views", color: "#0891b2" },
} satisfies ChartConfig;

const projectChartConfig = {
  count: { label: "Clicks", color: "#e11d48" },
} satisfies ChartConfig;

export function LocationChart({ data }: { data: LocationData[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Visitor Locations (by Country)
          </CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm py-8 text-center">
            No location data yet
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.slice(0, 10).map((item) => ({
    name: item.country || item.region,
    count: item.count,
    fill: "#7c3aed",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Visitor Locations (by Country)
        </CardTitle>
        <CardDescription>Last 30 days — Top 10</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={locationChartConfig}
          className="max-h-[350px] w-full"
        >
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 16, right: 16 }}
          >
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              width={80}
            />
            <XAxis type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function RegionChart({ data }: { data: LocationData[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Visitor Locations (by Region/State)
          </CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm py-8 text-center">
            No region data yet
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.slice(0, 10).map((item) => ({
    name: item.region,
    count: item.count,
    fill: "#16a34a",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Visitor Locations (by Region/State)
        </CardTitle>
        <CardDescription>Last 30 days — Top 10</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={locationChartConfig}
          className="max-h-[350px] w-full"
        >
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 16, right: 16 }}
          >
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <XAxis type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function TopBlogPostsChart({ data }: { data: BlogPostData[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Top Blog Posts
          </CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm py-8 text-center">
            No blog view data yet
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: item.slug.length > 25 ? item.slug.slice(0, 25) + "…" : item.slug,
    count: item.count,
    fill: "#0891b2",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Top Blog Posts
        </CardTitle>
        <CardDescription>Last 30 days — by views</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={blogChartConfig}
          className="max-h-[350px] w-full"
        >
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 16, right: 16 }}
          >
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              width={150}
            />
            <XAxis type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function TopProjectsChart({ data }: { data: ProjectClickData[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Top Projects (by clicks)
          </CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm py-8 text-center">
            No project click data yet
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name:
      item.project.length > 25
        ? item.project.slice(0, 25) + "…"
        : item.project,
    count: item.total,
    fill: "#e11d48",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Top Projects (by clicks)
        </CardTitle>
        <CardDescription>
          Last 30 days — Live + GitHub link clicks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={projectChartConfig}
          className="max-h-[350px] w-full"
        >
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 16, right: 16 }}
          >
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              width={150}
            />
            <XAxis type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
