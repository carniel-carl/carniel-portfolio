"use client";

import { Bar, BarChart, Cell, Label, Pie, PieChart, XAxis, YAxis } from "recharts";
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
import { useMemo } from "react";

type LocationData = { country: string; region: string; count: number };
type BlogPostData = { slug: string; title: string; count: number };
type SocialClickData = { platform: string; count: number };
type ProjectClickData = {
  project: string;
  live_clicks: number;
  code_clicks: number;
  total: number;
};

const COLORS = [
  "#7c3aed",
  "#0891b2",
  "#e11d48",
  "#16a34a",
  "#ea580c",
  "#2563eb",
  "#d97706",
  "#8b5cf6",
  "#06b6d4",
  "#f43f5e",
];

function getColor(chartOffset: number, index: number) {
  return COLORS[(chartOffset + index) % COLORS.length];
}

const locationChartConfig = {
  count: { label: "Views", color: "#7c3aed" },
} satisfies ChartConfig;

const blogChartConfig = {
  count: { label: "Views", color: "#0891b2" },
} satisfies ChartConfig;

const projectChartConfig = {
  count: { label: "Clicks", color: "#e11d48" },
} satisfies ChartConfig;

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm py-8 text-center">
          No data yet
        </p>
      </CardContent>
    </Card>
  );
}

// Horizontal Bar — good for ranked country list
export function LocationChart({ data }: { data: LocationData[] }) {
  if (!data || data.length === 0) {
    return <EmptyState title="Visitor Locations (by Country)" description="Last 30 days" />;
  }

  const chartData = data.slice(0, 10).map((item, i) => ({
    name: item.country || item.region,
    count: item.count,
    fill: getColor(0, i),
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
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={entry.name} fill={getColor(0, i)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Donut chart — shows regional distribution
export function RegionChart({ data }: { data: LocationData[] }) {
  if (!data || data.length === 0) {
    return <EmptyState title="Visitor Locations (by Region/State)" description="Last 30 days" />;
  }

  const chartData = data.slice(0, 8).map((item, i) => ({
    name: item.region,
    value: item.count,
    fill: getColor(3, i),
  }));

  const total = useMemo(
    () => chartData.reduce((sum, item) => sum + item.value, 0),
    [chartData],
  );

  const regionConfig = Object.fromEntries(
    chartData.map((item) => [item.name, { label: item.name, color: item.fill }]),
  ) satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Visitor Locations (by Region/State)
        </CardTitle>
        <CardDescription>Last 30 days — Top 8</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={regionConfig}
          className="mx-auto aspect-square max-h-[350px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={120}
              strokeWidth={2}
            >
              {chartData.map((entry, i) => (
                <Cell key={entry.name} fill={getColor(3, i)} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {total}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground text-xs"
                        >
                          visits
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Pie chart — perfect for few discrete social platforms
export function SocialClicksChart({ data }: { data: SocialClickData[] }) {
  if (!data || data.length === 0) {
    return <EmptyState title="Social Link Clicks (by Platform)" description="Last 30 days" />;
  }

  const chartData = data.map((item, i) => ({
    name: item.platform,
    value: item.count,
    fill: getColor(5, i),
  }));

  const total = useMemo(
    () => chartData.reduce((sum, item) => sum + item.value, 0),
    [chartData],
  );

  const socialPieConfig = Object.fromEntries(
    chartData.map((item) => [item.name, { label: item.name, color: item.fill }]),
  ) satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Social Link Clicks (by Platform)
        </CardTitle>
        <CardDescription>Last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={socialPieConfig}
          className="mx-auto aspect-square max-h-[350px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={120}
              strokeWidth={2}
            >
              {chartData.map((entry, i) => (
                <Cell key={entry.name} fill={getColor(5, i)} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {total}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground text-xs"
                        >
                          clicks
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Horizontal bar — good for ranked blog post list
export function TopBlogPostsChart({ data }: { data: BlogPostData[] }) {
  if (!data || data.length === 0) {
    return <EmptyState title="Top Blog Posts" description="Last 30 days" />;
  }

  const chartData = data.map((item, i) => ({
    name: item.slug.length > 25 ? item.slug.slice(0, 25) + "…" : item.slug,
    count: item.count,
    fill: getColor(2, i),
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
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={entry.name} fill={getColor(2, i)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Vertical bar — different orientation for project comparison
export function TopProjectsChart({ data }: { data: ProjectClickData[] }) {
  if (!data || data.length === 0) {
    return <EmptyState title="Top Projects (by clicks)" description="Last 30 days" />;
  }

  const chartData = data.map((item, i) => ({
    name:
      item.project.length > 15
        ? item.project.slice(0, 15) + "…"
        : item.project,
    count: item.total,
    fill: getColor(6, i),
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
            margin={{ left: 8, right: 8, bottom: 40 }}
          >
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              angle={-35}
              textAnchor="end"
              interval={0}
              fontSize={12}
            />
            <YAxis hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={entry.name} fill={getColor(6, i)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
