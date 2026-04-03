"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// { date: "2025-04-01", happy: 10, calm: 15, anxious: 5 }
const chartData = [
  { date: "2025-04-01", happy: 10, calm: 15, anxious: 5 },
  { date: "2025-04-02", happy: 12, calm: 8, anxious: 7 },
  { date: "2025-04-03", happy: 14, calm: 10, anxious: 4 },
  { date: "2025-04-04", happy: 8, calm: 12, anxious: 9 },
  { date: "2025-04-05", happy: 18, calm: 9, anxious: 3 },
  { date: "2025-04-06", happy: 6, calm: 14, anxious: 8 },
  { date: "2025-04-07", happy: 15, calm: 7, anxious: 5 },
  { date: "2025-04-08", happy: 20, calm: 11, anxious: 2 },
  { date: "2025-04-09", happy: 5, calm: 6, anxious: 12 },
  { date: "2025-04-10", happy: 13, calm: 9, anxious: 6 },
  { date: "2025-04-11", happy: 16, calm: 8, anxious: 4 },
  { date: "2025-04-12", happy: 9, calm: 13, anxious: 7 },
  { date: "2025-04-13", happy: 19, calm: 10, anxious: 3 },
  { date: "2025-04-14", happy: 7, calm: 11, anxious: 9 },
  { date: "2025-04-15", happy: 11, calm: 8, anxious: 6 },
  { date: "2025-04-16", happy: 14, calm: 9, anxious: 5 },
  { date: "2025-04-17", happy: 22, calm: 12, anxious: 4 },
  { date: "2025-04-18", happy: 8, calm: 15, anxious: 7 },
  { date: "2025-04-19", happy: 17, calm: 10, anxious: 3 },
  { date: "2025-04-20", happy: 6, calm: 7, anxious: 11 },
  { date: "2025-04-21", happy: 13, calm: 9, anxious: 8 },
  { date: "2025-04-22", happy: 15, calm: 11, anxious: 5 },
  { date: "2025-04-23", happy: 9, calm: 8, anxious: 10 },
  { date: "2025-04-24", happy: 18, calm: 13, anxious: 4 },
  { date: "2025-04-25", happy: 12, calm: 10, anxious: 7 },
  { date: "2025-04-26", happy: 5, calm: 6, anxious: 9 },
  { date: "2025-04-27", happy: 20, calm: 14, anxious: 5 },
  { date: "2025-04-28", happy: 8, calm: 9, anxious: 11 },
  { date: "2025-04-29", happy: 16, calm: 11, anxious: 6 },
  { date: "2025-04-30", happy: 21, calm: 15, anxious: 3 },
  { date: "2025-05-01", happy: 11, calm: 8, anxious: 7 },
  { date: "2025-05-02", happy: 17, calm: 12, anxious: 4 },
  { date: "2025-05-03", happy: 9, calm: 10, anxious: 8 },
  { date: "2025-05-04", happy: 19, calm: 14, anxious: 5 },
  { date: "2025-05-05", happy: 23, calm: 16, anxious: 2 },
  { date: "2025-05-06", happy: 25, calm: 18, anxious: 4 },
  { date: "2025-05-07", happy: 18, calm: 13, anxious: 7 },
  { date: "2025-05-08", happy: 7, calm: 9, anxious: 12 },
  { date: "2025-05-09", happy: 14, calm: 11, anxious: 6 },
  { date: "2025-05-10", happy: 16, calm: 12, anxious: 5 },
  { date: "2025-05-11", happy: 12, calm: 10, anxious: 8 },
  { date: "2025-05-12", happy: 9, calm: 11, anxious: 7 },
  { date: "2025-05-13", happy: 8, calm: 7, anxious: 10 },
  { date: "2025-05-14", happy: 22, calm: 17, anxious: 5 },
  { date: "2025-05-15", happy: 24, calm: 15, anxious: 3 },
  { date: "2025-05-16", happy: 17, calm: 14, anxious: 6 },
  { date: "2025-05-17", happy: 26, calm: 19, anxious: 4 },
  { date: "2025-05-18", happy: 14, calm: 12, anxious: 8 },
  { date: "2025-05-19", happy: 10, calm: 8, anxious: 9 },
  { date: "2025-05-20", happy: 8, calm: 11, anxious: 10 },
  { date: "2025-05-21", happy: 5, calm: 6, anxious: 11 },
  { date: "2025-05-22", happy: 4, calm: 7, anxious: 13 },
  { date: "2025-05-23", happy: 13, calm: 10, anxious: 8 },
  { date: "2025-05-24", happy: 15, calm: 11, anxious: 7 },
  { date: "2025-05-25", happy: 11, calm: 9, anxious: 6 },
  { date: "2025-05-26", happy: 9, calm: 8, anxious: 10 },
  { date: "2025-05-27", happy: 21, calm: 16, anxious: 5 },
  { date: "2025-05-28", happy: 12, calm: 10, anxious: 8 },
  { date: "2025-05-29", happy: 6, calm: 5, anxious: 12 },
  { date: "2025-05-30", happy: 18, calm: 13, anxious: 7 },
  { date: "2025-05-31", happy: 10, calm: 9, anxious: 11 },
  { date: "2025-06-01", happy: 11, calm: 8, anxious: 9 },
  { date: "2025-06-02", happy: 23, calm: 18, anxious: 4 },
  { date: "2025-06-03", happy: 7, calm: 6, anxious: 10 },
  { date: "2025-06-04", happy: 20, calm: 15, anxious: 6 },
  { date: "2025-06-05", happy: 5, calm: 7, anxious: 11 },
  { date: "2025-06-06", happy: 16, calm: 12, anxious: 8 },
  { date: "2025-06-07", happy: 18, calm: 14, anxious: 5 },
  { date: "2025-06-08", happy: 19, calm: 13, anxious: 7 },
  { date: "2025-06-09", happy: 24, calm: 19, anxious: 3 },
  { date: "2025-06-10", happy: 9, calm: 11, anxious: 8 },
  { date: "2025-06-11", happy: 6, calm: 8, anxious: 10 },
  { date: "2025-06-12", happy: 22, calm: 17, anxious: 5 },
  { date: "2025-06-13", happy: 4, calm: 6, anxious: 12 },
  { date: "2025-06-14", happy: 21, calm: 16, anxious: 7 },
  { date: "2025-06-15", happy: 17, calm: 14, anxious: 9 },
  { date: "2025-06-16", happy: 15, calm: 12, anxious: 8 },
  { date: "2025-06-17", happy: 25, calm: 20, anxious: 4 },
  { date: "2025-06-18", happy: 8, calm: 9, anxious: 11 },
  { date: "2025-06-19", happy: 19, calm: 15, anxious: 6 },
  { date: "2025-06-20", happy: 22, calm: 17, anxious: 5 },
  { date: "2025-06-21", happy: 12, calm: 10, anxious: 7 },
  { date: "2025-06-22", happy: 16, calm: 13, anxious: 8 },
  { date: "2025-06-23", happy: 24, calm: 19, anxious: 3 },
  { date: "2025-06-24", happy: 7, calm: 8, anxious: 10 },
  { date: "2025-06-25", happy: 9, calm: 10, anxious: 8 },
  { date: "2025-06-26", happy: 20, calm: 15, anxious: 6 },
  { date: "2025-06-27", happy: 23, calm: 18, anxious: 4 },
  { date: "2025-06-28", happy: 8, calm: 11, anxious: 9 },
  { date: "2025-06-29", happy: 6, calm: 7, anxious: 12 },
  { date: "2025-06-30", happy: 21, calm: 16, anxious: 5 },
];
const chartConfig = {
  happy: {
    label: "高兴",
    color: "var(--chart-1)",
  },
  calm: {
    label: "难过",
    color: "var(--chart-5)",
  },
  anxious: {
    label: "焦虑",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const [timeRange, setTimeRange] = React.useState("90d");

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date("2025-06-30");
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>长期趋势分析</CardTitle>
          <CardDescription>
            显示最近
            {timeRange === "90d"
              ? "三个月"
              : timeRange === "30d"
                ? "三十天"
                : "七天"}
            的访问量
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select a value"
          >
            <SelectValue placeholder="最近三十天" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              最近三个月
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              最近三十天
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              最近七天
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillHappy" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-happy)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-happy)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillCalm" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-calm)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-calm)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillAnxious" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-anxious)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-anxious)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("zh-CN", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("zh-CN", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="happy"
              type="natural"
              fill="url(#fillHappy)"
              stroke="var(--color-happy)"
            />
            <Area
              dataKey="calm"
              type="natural"
              fill="url(#fillCalm)"
              stroke="var(--color-calm)"
            />
            <Area
              dataKey="anxious"
              type="natural"
              fill="url(#fillAnxious)"
              stroke="var(--color-anxious)"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
