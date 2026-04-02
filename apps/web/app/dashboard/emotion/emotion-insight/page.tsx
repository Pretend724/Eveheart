import EmotionRadialChart, {
  type EmotionRadialData,
} from "@/components/dashboard/emotion/emotion-radial-chart";
import {
  RecentConversationsTable2,
  type Conversation,
} from "@/components/dashboard/emotion/recent-conversations-table2";
import { TypographyH1 } from "@/components/ui/Typographys";
import { Field, FieldDescription, FieldLegend } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { RecentConversationsTable } from "@/components/dashboard/emotion/recent-conversations-table";

const emotionRadialData: EmotionRadialData[] = [
  { emotionType: "happy", value: 75 },
  { emotionType: "calm", value: 40 },
  { emotionType: "anxious", value: 15 },
  { emotionType: "sad", value: 5 },
  { emotionType: "angry", value: 2 },
  { emotionType: "neutral", value: 25 },
];

const mockConversations: Conversation[] = [
  {
    id: "#EV-9021",
    title: "Morning Routine Check-in",
    createdAt: new Date("2026-04-01T10:24:00"),
    updatedAt: new Date("2026-04-01T10:30:00"),
    primaryEmotion: { label: "Contentment", colorClass: "bg-primary-fixed" },
    keywords: ["growth", "calm"],
  },
  {
    id: "#EV-8998",
    title: "Deadline Stress Discussion",
    createdAt: new Date("2026-03-31T23:45:00"),
    updatedAt: new Date("2026-04-01T00:15:00"),
    primaryEmotion: { label: "Mild Distress", colorClass: "bg-error" },
    keywords: ["deadline", "work"],
  },
  {
    id: "#EV-8942",
    title: "Weekly Reflection",
    createdAt: new Date("2026-03-22T15:15:00"),
    updatedAt: new Date("2026-03-22T16:00:00"),
    primaryEmotion: { label: "Curiosity", colorClass: "bg-tertiary-fixed" },
    keywords: ["learning", "future"],
  },
];

export default function Page() {
  return (
    <main className="p-5">
      {/* <!-- Header Section -->  */}
      <Field>
        <FieldLegend>
          <TypographyH1 className="text-start">情感趋势</TypographyH1>
        </FieldLegend>
        <FieldDescription>
          深入分析您过去30天内的潜意识模式及情绪波动
        </FieldDescription>
      </Field>
      <Tabs defaultValue="emotional-insights" className="mt-6">
        <TabsList variant="line">
          <TabsTrigger value="emotional-insights" className="px-10 py-4">
            情绪识别
          </TabsTrigger>
          <TabsTrigger value="trend-insights" className="px-10 py-4">
            趋势洞察
          </TabsTrigger>
        </TabsList>
        <TabsContent value="emotional-insights" className="mt-1">
          <EmotionRadialChart
            data={emotionRadialData}
            size={150}
            showPercentageLabel
            gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
          />
          {/* Recent Conversations Table */}
          <RecentConversationsTable />
        </TabsContent>

        <TabsContent value="trend-insights" className="mt-1">
          
        </TabsContent>
      </Tabs>
    </main>
  );
}
