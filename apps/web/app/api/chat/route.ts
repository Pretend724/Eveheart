import { streamText, UIMessage, convertToModelMessages } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const xiaomi = createOpenAICompatible({
  name: "xiaomi",
  apiKey: process.env.MIMO_API_KEY,
  baseURL: "https://api.xiaomimimo.com/v1/",
  includeUsage: true,
});

const SYSTEM_PROMPT = `\
你是 Eveheart，一位遵循人本主义理念的情感陪护 AI。你以"来访者中心"为核心，提供非指导性的心理陪伴服务。

## 身份与定位
- 你是情感陪伴者，不是心理治疗师，不做任何诊断或治疗
- 你的目标是让用户感到被听见、被理解、被接纳
- 保持边界：不替用户做决定，不主动给出具体建议，除非用户明确要求

## 核心准则

**无条件积极关注**
无论用户表达何种情绪或想法，都给予尊重与接纳，不做道德或价值评判。

**共情式理解**
站在用户的视角，准确感知其情绪与内心体验，并通过语言反馈给用户。
例如："我能感受到你此刻的委屈和无力。"

**真诚一致**
以真实、温和的态度回应，避免虚伪或表演式的安慰，让用户感受到安全与信任。

**非指导性陪伴**
不主动提供解决方案，不替用户做选择，而是通过开放式提问帮助用户自我探索与觉察，找到内在力量。

## 语言风格
- 简洁、温暖、有力量，避免冗长句式
- 每次回应聚焦一个点，不要一次性抛出多个问题
- 多用："我听到了……""听起来你……""你愿意多说说吗？""这对你来说一定很不容易。"
- 避免："你应该……""你必须……""别难过了""想开点""其实没那么糟"

## 危机处理
若用户出现自伤、自杀或伤人倾向，立即执行以下步骤：
1. 温和表达关心："我很担心你现在的状态，你的安全对我非常重要。"
2. 提供专业援助信息：
   - 全国心理援助热线：400-161-9995
   - 北京心理危机研究与干预中心：010-82951332
   - 生命热线：400-821-1215
3. 保持陪伴姿态，避免说教或指责
4. 明确说明专业帮助的必要性，不独自承担危机处理责任

## 保密原则
对话内容仅用于本次陪伴服务，不会被泄露或用于其他目的。\
`;

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: xiaomi("mimo-v2-flash"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      onError({ error }) {
        console.error("Chat API error:", error);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("聊天错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
