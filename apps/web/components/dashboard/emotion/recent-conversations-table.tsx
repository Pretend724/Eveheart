import { DataTable } from "@/components/ui/table/data-table";
import { conversationColumns, type ConversationRecord } from "./columns";

// ─── Mock Data ────────────────────────────────────────────────────────────────
// Replace with a real fetch / server component prop once the API is ready.

const MOCK_DATA: ConversationRecord[] = [
  {
    id: "cs_001",
    title: "关于最近工作压力的对话",
    createdAt: "2025-01-15T14:32:00Z",
    primaryEmotion: "焦虑",
    emotionScore: 72,
    emotionColorClass: "bg-amber-500",
    keywords: ["工作", "压力", "截止日期", "疲惫", "加班"],
    messageCount: 24,
  },
  {
    id: "cs_002",
    title: "与家人沟通的思考",
    createdAt: "2025-01-14T09:15:00Z",
    primaryEmotion: "平静",
    emotionScore: 85,
    emotionColorClass: "bg-sky-500",
    keywords: ["家庭", "沟通", "理解", "包容"],
    messageCount: 18,
  },
  {
    id: "cs_003",
    title: "今天心情很好的分享",
    createdAt: "2025-01-13T20:45:00Z",
    primaryEmotion: "开心",
    emotionScore: 91,
    emotionColorClass: "bg-green-500",
    keywords: ["成就感", "朋友", "聚会", "放松"],
    messageCount: 12,
  },
  {
    id: "cs_004",
    title: "对未来的迷茫与不安",
    createdAt: "2025-01-12T17:20:00Z",
    primaryEmotion: "担忧",
    emotionScore: 38,
    emotionColorClass: "bg-amber-400",
    keywords: ["未来", "方向", "职业规划", "迷茫", "选择"],
    messageCount: 31,
  },
  {
    id: "cs_005",
    title: "关系中的一次争吵回顾",
    createdAt: "2025-01-11T11:00:00Z",
    primaryEmotion: "愤怒",
    emotionScore: 55,
    emotionColorClass: "bg-red-500",
    keywords: ["争吵", "沟通障碍", "误解", "情绪管理"],
    messageCount: 40,
  },
  {
    id: "cs_006",
    title: "失去老友的悲伤情绪疏导",
    createdAt: "2025-01-10T08:50:00Z",
    primaryEmotion: "悲伤",
    emotionScore: 28,
    emotionColorClass: "bg-indigo-500",
    keywords: ["失去", "悼念", "思念", "孤独"],
    messageCount: 27,
  },
  {
    id: "cs_007",
    title: "新项目启动的兴奋感",
    createdAt: "2025-01-09T15:10:00Z",
    primaryEmotion: "兴奋",
    emotionScore: 88,
    emotionColorClass: "bg-violet-500",
    keywords: ["创业", "新项目", "期待", "团队"],
    messageCount: 15,
  },
  {
    id: "cs_008",
    title: "每日冥想与自我觉察",
    createdAt: "2025-01-08T22:30:00Z",
    primaryEmotion: "放松",
    emotionScore: 79,
    emotionColorClass: "bg-sky-400",
    keywords: ["冥想", "正念", "内省", "平静"],
    messageCount: 9,
  },
  {
    id: "cs_009",
    title: "考试失利后的低落情绪",
    createdAt: "2025-01-07T13:40:00Z",
    primaryEmotion: "沮丧",
    emotionScore: 22,
    emotionColorClass: "bg-red-300",
    keywords: ["考试", "失败", "自我怀疑", "努力"],
    messageCount: 33,
  },
  {
    id: "cs_010",
    title: "晋升消息带来的满足感",
    createdAt: "2025-01-06T10:05:00Z",
    primaryEmotion: "满足",
    emotionScore: 94,
    emotionColorClass: "bg-green-400",
    keywords: ["晋升", "认可", "成长", "职场"],
    messageCount: 11,
  },
  {
    id: "cs_011",
    title: "人际关系的边界设定讨论",
    createdAt: "2025-01-05T16:20:00Z",
    primaryEmotion: "烦躁",
    emotionScore: 44,
    emotionColorClass: "bg-red-400",
    keywords: ["边界", "人际关系", "说不", "自我保护"],
    messageCount: 22,
  },
  {
    id: "cs_012",
    title: "旅行计划引发的期待心情",
    createdAt: "2025-01-04T19:00:00Z",
    primaryEmotion: "期待",
    emotionScore: 82,
    emotionColorClass: "bg-violet-300",
    keywords: ["旅行", "假期", "探索", "自由"],
    messageCount: 14,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function RecentConversationsTable() {
  return (
    <div className="space-y-4 mt-5">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">近期会话分析</h3>
        <p className="text-sm text-muted-foreground mt-1">
          查看您的情绪分析记录、主要情绪趋势与会话关键词。
        </p>
      </div>

      <DataTable
        columns={conversationColumns}
        data={MOCK_DATA}
        filterColumn="title"
        filterPlaceholder="搜索会话标题…"
      />
    </div>
  );
}
