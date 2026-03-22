"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardChartProps {
  data: {
    projectCount: number;
    skillCount: number;
    postCount: number;
    publishedCount: number;
    socialCount: number;
  };
}

const chartConfig = {
  count: {
    label: "Count",
  },
  projects: {
    label: "Projects",
    color: "#7c3aed",
  },
  skills: {
    label: "Skills",
    color: "#0891b2",
  },
  published: {
    label: "Published",
    color: "#16a34a",
  },
  drafts: {
    label: "Drafts",
    color: "#e11d48",
  },
  socials: {
    label: "Socials",
    color: "#f59e0b",
  },
} satisfies ChartConfig;

export default function DashboardChart({ data }: DashboardChartProps) {
  const chartData = [
    { name: "projects", count: data.projectCount, fill: "#7c3aed" },
    { name: "skills", count: data.skillCount, fill: "#0891b2" },
    { name: "published", count: data.publishedCount, fill: "#16a34a" },
    {
      name: "drafts",
      count: data.postCount - data.publishedCount,
      fill: "#e11d48",
    },
    { name: "socials", count: data.socialCount, fill: "#f59e0b" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Content Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="max-h-[300px] w-full">
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
              tickFormatter={(value) =>
                chartConfig[value as keyof typeof chartConfig]?.label ?? value
              }
            />
            <XAxis type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent nameKey="name" hideLabel />}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
