"use client";

import type { CSSProperties } from "react";
import {
  Label,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type EmotionType =
  | "happy"
  | "calm"
  | "anxious"
  | "sad"
  | "angry"
  | "neutral"
  | (string & {});

export interface EmotionRadialData {
  emotionType: EmotionType;
  value: number;
}

export interface EmotionRadialChartProps {
  data: EmotionRadialData[];
  colorMap?: Record<string, string>;
  labelMap?: Record<string, string>;
  size?: number;
  ringThickness?: number;
  showPercentageLabel?: boolean;
  className?: string;
  gridClassName?: string;
  cardClassName?: string;
}

const baseChartConfig: ChartConfig = {
  value: {
    label: "占比",
  },
};

const defaultEmotionColorMap: Record<string, string> = {
  happy: "var(--chart-1)",
  calm: "var(--chart-3)",
  anxious: "var(--chart-4)",
  sad: "var(--chart-5)",
  angry: "var(--chart-2)",
  neutral: "var(--chart-6)",
};

const defaultEmotionLabelMap: Record<string, string> = {
  happy: "高兴",
  calm: "平静",
  anxious: "焦虑",
  sad: "难过",
  angry: "愤怒",
  neutral: "中性",
};

function clampPercentage(value: number) {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

export default function EmotionRadialChart({
  data,
  colorMap = defaultEmotionColorMap,
  labelMap = defaultEmotionLabelMap,
  size = 140,
  ringThickness = 10,
  showPercentageLabel = true,
  className,
  gridClassName,
  cardClassName,
}: EmotionRadialChartProps) {
  const outerRadius = Math.floor(size * 0.42); //default 58
  const innerRadius = Math.max(outerRadius - ringThickness, 10); //default 44

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6",
          gridClassName,
        )}
      >
        {data.map((item, index) => {
          const normalizedValue = clampPercentage(item.value);
          const emotionColor = colorMap[item.emotionType] ?? "var(--chart-1)";
          const emotionLabel = labelMap[item.emotionType] ?? item.emotionType;
          const chartData = [
            {
              emotionType: item.emotionType,
              value: normalizedValue,
              fill: emotionColor,
            },
          ];

          return (
            <Card
              key={`${item.emotionType}-${index}`}
              className={cn(
                "relative overflow-hidden border-border/60 bg-card/90 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
                cardClassName,
              )}
            >
              <CardContent className="flex-1 pb-0">
                <ChartContainer
                  config={baseChartConfig}
                  className="mx-auto aspect-square"
                  style={{ width: size, height: size } as CSSProperties}
                >
                  <RadialBarChart
                    data={chartData}
                    startAngle={0}
                    endAngle={360}
                    outerRadius={outerRadius}
                    innerRadius={innerRadius}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      tick={false}
                    />
                    <PolarGrid
                      gridType="circle"
                      radialLines={false}
                      stroke="none"
                      className="first:fill-muted last:fill-background"
                      polarRadius={[outerRadius, innerRadius]}
                    />
                    <RadialBar
                      dataKey="value"
                      background
                      cornerRadius={ringThickness / 2}
                    />
                    <PolarRadiusAxis
                      tick={false}
                      tickLine={false}
                      axisLine={false}
                    >
                      {showPercentageLabel ? (
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
                                    className="fill-foreground text-2xl font-semibold"
                                  >
                                    {`${Math.round(normalizedValue)}%`}
                                  </tspan>
                                </text>
                              );
                            }

                            return null;
                          }}
                        />
                      ) : null}
                    </PolarRadiusAxis>
                  </RadialBarChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="justify-center font-medium text-muted-foreground">
                {emotionLabel}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
