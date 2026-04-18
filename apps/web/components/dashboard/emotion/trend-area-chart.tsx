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
  { date: "2026-02-01", happy: 10, calm: 15, anxious: 5 },
  { date: "2026-02-02", happy: 12, calm: 8, anxious: 7 },
  { date: "2026-02-03", happy: 14, calm: 10, anxious: 4 },
  { date: "2026-02-04", happy: 8, calm: 12, anxious: 9 },
  { date: "2026-02-05", happy: 18, calm: 9, anxious: 3 },
  { date: "2026-02-06", happy: 6, calm: 14, anxious: 8 },
  { date: "2026-02-07", happy: 15, calm: 7, anxious: 5 },
  { date: "2026-02-08", happy: 20, calm: 11, anxious: 2 },
  { date: "2026-02-09", happy: 5, calm: 6, anxious: 12 },
  { date: "2026-02-10", happy: 13, calm: 9, anxious: 6 },
  { date: "2026-02-11", happy: 16, calm: 8, anxious: 4 },
  { date: "2026-02-12", happy: 9, calm: 13, anxious: 7 },
  { date: "2026-02-13", happy: 19, calm: 10, anxious: 3 },
  { date: "2026-02-14", happy: 7, calm: 11, anxious: 9 },
  { date: "2026-02-15", happy: 11, calm: 8, anxious: 6 },
  { date: "2026-02-16", happy: 14, calm: 9, anxious: 5 },
  { date: "2026-02-17", happy: 22, calm: 12, anxious: 4 },
  { date: "2026-02-18", happy: 8, calm: 15, anxious: 7 },
  { date: "2026-02-19", happy: 17, calm: 10, anxious: 3 },
  { date: "2026-02-20", happy: 6, calm: 7, anxious: 11 },
  { date: "2026-02-21", happy: 13, calm: 9, anxious: 8 },
  { date: "2026-02-22", happy: 15, calm: 11, anxious: 5 },
  { date: "2026-02-23", happy: 9, calm: 8, anxious: 10 },
  { date: "2026-02-24", happy: 18, calm: 13, anxious: 4 },
  { date: "2026-02-25", happy: 12, calm: 10, anxious: 7 },
  { date: "2026-02-26", happy: 5, calm: 6, anxious: 9 },
  { date: "2026-02-27", happy: 20, calm: 14, anxious: 5 },
  { date: "2026-02-28", happy: 8, calm: 9, anxious: 11 },
  { date: "2026-03-01", happy: 16, calm: 11, anxious: 6 },
  { date: "2026-03-02", happy: 21, calm: 15, anxious: 3 },
  { date: "2026-03-03", happy: 11, calm: 8, anxious: 7 },
  { date: "2026-03-04", happy: 17, calm: 12, anxious: 4 },
  { date: "2026-03-05", happy: 9, calm: 10, anxious: 8 },
  { date: "2026-03-06", happy: 19, calm: 14, anxious: 5 },
  { date: "2026-03-07", happy: 23, calm: 16, anxious: 2 },
  { date: "2026-03-08", happy: 25, calm: 18, anxious: 4 },
  { date: "2026-03-09", happy: 18, calm: 13, anxious: 7 },
  { date: "2026-03-10", happy: 7, calm: 9, anxious: 12 },
  { date: "2026-03-11", happy: 14, calm: 11, anxious: 6 },
  { date: "2026-03-12", happy: 16, calm: 12, anxious: 5 },
  { date: "2026-03-13", happy: 12, calm: 10, anxious: 8 },
  { date: "2026-03-14", happy: 9, calm: 11, anxious: 7 },
  { date: "2026-03-15", happy: 8, calm: 7, anxious: 10 },
  { date: "2026-03-16", happy: 22, calm: 17, anxious: 5 },
  { date: "2026-03-17", happy: 24, calm: 15, anxious: 3 },
  { date: "2026-03-18", happy: 17, calm: 14, anxious: 6 },
  { date: "2026-03-19", happy: 26, calm: 19, anxious: 4 },
  { date: "2026-03-20", happy: 14, calm: 12, anxious: 8 },
  { date: "2026-03-21", happy: 10, calm: 8, anxious: 9 },
  { date: "2026-03-22", happy: 8, calm: 11, anxious: 10 },
  { date: "2026-03-23", happy: 5, calm: 6, anxious: 11 },
  { date: "2026-03-24", happy: 4, calm: 7, anxious: 13 },
  { date: "2026-03-25", happy: 13, calm: 10, anxious: 8 },
  { date: "2026-03-26", happy: 15, calm: 11, anxious: 7 },
  { date: "2026-03-27", happy: 11, calm: 9, anxious: 6 },
  { date: "2026-03-28", happy: 9, calm: 8, anxious: 10 },
  { date: "2026-03-29", happy: 21, calm: 16, anxious: 5 },
  { date: "2026-03-30", happy: 12, calm: 10, anxious: 8 },
  { date: "2026-03-31", happy: 6, calm: 5, anxious: 12 },
  { date: "2026-04-01", happy: 18, calm: 13, anxious: 7 },
  { date: "2026-04-02", happy: 10, calm: 9, anxious: 11 },
  { date: "2026-04-03", happy: 11, calm: 8, anxious: 9 },
  { date: "2026-04-04", happy: 23, calm: 18, anxious: 4 },
  { date: "2026-04-05", happy: 7, calm: 6, anxious: 10 },
  { date: "2026-04-06", happy: 20, calm: 15, anxious: 6 },
  { date: "2026-04-07", happy: 5, calm: 7, anxious: 11 },
  { date: "2026-04-08", happy: 16, calm: 12, anxious: 8 },
  { date: "2026-04-09", happy: 18, calm: 14, anxious: 5 },
  { date: "2026-04-10", happy: 19, calm: 13, anxious: 7 },
  { date: "2026-04-11", happy: 24, calm: 19, anxious: 3 },
  { date: "2026-04-12", happy: 9, calm: 11, anxious: 8 },
  { date: "2026-04-13", happy: 6, calm: 8, anxious: 10 },
  { date: "2026-04-14", happy: 22, calm: 17, anxious: 5 },
  { date: "2026-04-15", happy: 4, calm: 6, anxious: 12 },
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

function parseChartDate(value: string) {
  const normalizedValue = value.includes("T") ? value : `${value}T00:00:00`;
  const parsedDate = new Date(normalizedValue);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatChartDate(value: string) {
  const parsedDate = parseChartDate(value);
  if (!parsedDate) {
    return value;
  }

  return parsedDate.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
}

export function ChartAreaInteractive() {
  const [timeRange, setTimeRange] = React.useState("90d");

  const referenceDate = React.useMemo(() => {
    const parsedDates = chartData
      .map((item) => parseChartDate(item.date))
      .filter((item): item is Date => item !== null);

    if (parsedDates.length === 0) {
      return null;
    }

    return new Date(
      Math.max(...parsedDates.map((item) => item.getTime())),
    );
  }, []);

  const filteredData = React.useMemo(() => {
    if (!referenceDate) {
      return chartData;
    }

    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }

    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return chartData.filter((item) => {
      const parsedDate = parseChartDate(item.date);
      if (!parsedDate) {
        return false;
      }

      return parsedDate >= startDate && parsedDate <= referenceDate;
    });
  }, [referenceDate, timeRange]);

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
              tickFormatter={(value) => formatChartDate(String(value))}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => formatChartDate(String(value))}
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
