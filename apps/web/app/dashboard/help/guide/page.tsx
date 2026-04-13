import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Bot,
  ChevronRight,
  Compass,
  Database,
  Download,
  FileText,
  FolderOpen,
  Info,
  Key,
  Languages,
  Lock,
  MessageCircle,
  Play,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";

type Step = {
  title: string;
  description: string;
};

type Panel = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type Concept = {
  title: string;
  description: string;
};

type GuideModule = {
  value: string;
  label: string;
  title: string;
  subtitle: string;
  description: string;
  route: string;
  icon: LucideIcon;
  highlights: Array<{
    label: string;
    tooltip?: string;
  }>;
  steps: Step[];
  panels: Panel[];
  concepts: Concept[];
  relatedLinks: Array<{
    href: string;
    label: string;
  }>;
  previewTitle: string;
  previewCaption: string;
  previewItems: string[];
};

const guideModules: GuideModule[] = [
  {
    value: "quick-start",
    label: "快速开始",
    title: "快速开始",
    subtitle: "从注册、登录到第一段陪伴对话，先把主流程跑通。",
    description:
      "如果你是第一次使用 Eveheart，建议先熟悉账号登录、聊天入口与会话创建方式。完成这一页后，你就能独立开始一段完整对话。",
    route: "/dashboard/chat",
    icon: Rocket,
    highlights: [
      { label: "新手首读" },
      { label: "注册与登录" },
      { label: "首次会话" },
    ],
    steps: [
      {
        title: "创建账户并完成登录",
        description:
          "在登录页输入邮箱与密码完成身份验证。首次注册后，系统会为你准备个人资料与默认偏好。",
      },
      {
        title: "进入聊天入口",
        description:
          "从 Dashboard 侧边栏进入“对话”页面，系统会查找最近会话，或在需要时创建新的 ChatSession。",
      },
      {
        title: "发送第一条消息",
        description:
          "输入你当前的感受、问题或目标。Eveheart 会以流式方式返回回复，并将消息保存在会话中。",
      },
      {
        title: "回到历史会话继续交流",
        description:
          "之后你可以继续使用同一个会话，保持上下文连续；也可以切换到其他会话进行不同主题的整理。",
      },
    ],
    panels: [
      {
        title: "账号准备",
        description:
          "先确认你能正常登录，再进入帮助页后的功能模块学习会更顺畅。",
        icon: User,
      },
      {
        title: "会话建立",
        description:
          "聊天页会优先沿用已有会话，减少你重复创建与找回上下文的成本。",
        icon: MessageCircle,
      },
      {
        title: "陪伴节奏",
        description:
          "建议从简短问题开始，让系统逐步了解你的表达方式与情绪偏好。",
        icon: Sparkles,
      },
    ],
    concepts: [
      {
        title: "为什么我会被自动带到一个具体的会话页面？",
        description:
          "这是为了让每段对话拥有稳定的上下文与历史记录。系统会在你进入聊天时查找或创建会话，再重定向到对应的 session 页面。",
      },
      {
        title: "第一次不知道说什么，应该如何开始？",
        description:
          "可以先描述当下状态，例如“我今天有点焦虑”“我想整理最近的压力来源”，让 Eveheart 从陪伴、澄清与提问开始。",
      },
    ],
    relatedLinks: [{ href: "/dashboard/chat", label: "打开聊天页" }],
    previewTitle: "基础流程示意",
    previewCaption: "账号建立后，你的第一段对话通常会沿着这条路径展开。",
    previewItems: [
      "注册 / 登录",
      "创建或进入会话",
      "发送首条消息",
      "查看历史记录",
    ],
  },
  {
    value: "chat",
    label: "AI 对话",
    title: "AI 对话",
    subtitle: "理解流式回复、多会话切换，以及聊天历史如何持续生效。",
    description:
      "Eveheart 的聊天体验基于流式交互设计，回复会逐步显示，而不是等待整段文字生成完成。这样更接近真实陪伴的交流节奏。",
    route: "/dashboard/chat",
    icon: Bot,
    highlights: [
      {
        label: "流式回复",
        tooltip:
          "回复会一段段写出，便于你更快看到内容，也能更及时中断或继续追问。",
      },
      { label: "多会话管理" },
      { label: "useChat 驱动" },
    ],
    steps: [
      {
        title: "进入聊天并选定主题",
        description:
          "可以继续最近的会话，也可以重新开启一个新话题，让不同情绪或任务分别存放。",
      },
      {
        title: "观察流式输出",
        description:
          "消息会边生成边展示。你不需要等到全部完成才能理解整体方向，这对需要即时回应的场景尤其有帮助。",
      },
      {
        title: "围绕当前会话持续追问",
        description:
          "同一会话内的历史消息会作为上下文，帮助回复保持连贯、减少重复解释。",
      },
      {
        title: "切换会话管理不同问题",
        description:
          "把“日常陪伴”“压力拆解”“睡前整理”等主题放在不同会话中，会更容易回顾与归档。",
      },
    ],
    panels: [
      {
        title: "更快看到反馈",
        description:
          "流式回复降低等待感，尤其适合你在情绪波动时快速获得第一轮支持。",
        icon: Sparkles,
      },
      {
        title: "会话隔离更清晰",
        description:
          "不同会话保存不同上下文，避免把多个议题混在一起导致回复变得模糊。",
        icon: FolderOpen,
      },
      {
        title: "历史记录可回看",
        description:
          "系统会把消息保存下来，方便你之后回顾表达变化、总结规律或导出存档。",
        icon: FileText,
      },
    ],
    concepts: [
      {
        title: "流式交互和普通一次性回复有什么区别？",
        description:
          "一次性回复要等完整生成后再展示；流式交互会边生成边呈现，让你更快获得反馈，也更接近实时对话体验。",
      },
      {
        title: "多会话管理适合什么场景？",
        description:
          "当你有不同主题需要分开整理时，例如“情绪日记”“职场压力”“关系沟通”，分会话会让历史回顾更清晰。",
      },
    ],
    relatedLinks: [
      { href: "/dashboard/chat", label: "进入聊天" },
      { href: "/dashboard/chat/AI-avatar", label: "数字人交互" },
    ],
    previewTitle: "对话工作流示意",
    previewCaption: "前端接收流式内容，后端在回复完成后继续维护会话历史。",
    previewItems: [
      "发送消息",
      "逐段返回回复",
      "会话持续记忆",
      "切换与归档主题",
    ],
  },
  {
    value: "rag",
    label: "知识库",
    title: "知识库",
    subtitle: "把你的文档、资料与背景信息变成对话时可检索的上下文。",
    description:
      "知识库功能适合存放长期背景、个人说明、学习资料或方法论内容。对话时系统会按语义匹配相关片段，提高回复的贴合度。",
    route: "/dashboard/knowledge-base",
    icon: Database,
    highlights: [
      {
        label: "RAG",
        tooltip:
          "RAG 指检索增强生成：先找相关知识片段，再把片段作为上下文给模型参考。",
      },
      {
        label: "GraphRAG",
        tooltip:
          "GraphRAG 指知识图谱增强生成：先构建实体、关系、概念的知识网络，再在图中检索推理相关信息，最后给模型用于生成回答。",
      },
      { label: "文档分块" },
      { label: "上下文注入" },
    ],
    steps: [
      {
        title: "创建知识源",
        description:
          "为不同主题建立知识源，例如“我的偏好”“咨询笔记”“课程资料”或“关系背景”。",
      },
      {
        title: "导入文本并等待处理",
        description:
          "系统会把内容切成多个语义片段，并为每个片段生成向量表示，方便后续检索。",
      },
      {
        title: "发起与资料相关的提问",
        description:
          "当你的问题与知识库中的内容相近时，系统会优先检索相关片段作为补充上下文。",
      },
      {
        title: "根据回答效果继续优化资料",
        description:
          "如果回答不够精准，可以补充更明确的背景描述、拆分过长文本，或调整知识源内容结构。",
      },
    ],
    panels: [
      {
        title: "资料先整理，再检索",
        description: "越清晰、越结构化的知识源，越容易在对话中被准确命中。",
        icon: BookOpen,
      },
      {
        title: "分块提升命中率",
        description:
          "长文档会拆成多个片段，避免每次都把整篇内容塞进上下文，提升效率与相关性。",
        icon: Database,
      },
      {
        title: "注入而非替代",
        description:
          "知识库是对回答的补充，不是完全替代模型推理。它更像提供与你相关的背景材料。",
        icon: Sparkles,
      },
    ],
    concepts: [
      {
        title: "为什么系统要把文档切成很多小块？",
        description:
          "因为对话时真正相关的通常只是文档中的一小段。分块可以让系统只取必要内容，减少噪声并提升检索准确度。",
      },
      {
        title: "知识库注入是不是每次都会发生？",
        description:
          "不是。通常只有当你的最新问题与知识源内容语义接近时，系统才会检索并注入相关片段。",
      },
    ],
    relatedLinks: [
      { href: "/dashboard/knowledge-base", label: "管理知识库" },
      { href: "/dashboard/chat", label: "回到聊天验证效果" },
    ],
    previewTitle: "RAG 工作流示意",
    previewCaption: "知识进入系统后，会经历创建、分块、检索与注入这几步。",
    previewItems: ["建立知识源", "自动分块", "语义检索", "对话注入上下文"],
  },
  {
    value: "customization",
    label: "个性化定制",
    title: "个性化定制",
    subtitle:
      "根据你的模型偏好、API 配置与人设需求，调整 Eveheart 的回应方式。",
    description:
      "在偏好设置中，你可以切换 AI 提供商、调整模型、配置 API Key 与 Base URL，还能设定人设名称与回复语言。",
    route: "/dashboard/setting/preferences-setting",
    icon: Settings,
    highlights: [
      {
        label: "API Key",
        tooltip:
          "API Key 是访问模型服务的密钥。只有在使用外部服务商或自定义兼容接口时才需要填写。",
      },
      { label: "模型切换" },
      { label: "人设与语言" },
    ],
    steps: [
      {
        title: "打开偏好设置",
        description:
          "先进入“偏好设置”，检查当前默认提供商、模型和回复语言是否符合你的使用习惯。",
      },
      {
        title: "选择合适的 AI 服务",
        description:
          "你可以使用内置方案快速开始，也可以切换到 OpenAI、DeepSeek 或兼容 OpenAI 协议的服务。",
      },
      {
        title: "按需填写 API Key 与 Base URL",
        description:
          "如果使用外部服务，请填写对应密钥；如果你连接的是兼容接口，也可以补充 Base URL。",
      },
      {
        title: "保存人设、语言与可访问性偏好",
        description:
          "例如设定回复语言、角色名称、字号与提醒习惯，让体验更贴近你自己的节奏。",
      },
    ],
    panels: [
      {
        title: "模型切换",
        description:
          "不同模型在速度、推理风格与成本上各不相同，适合不同类型的交流任务。",
        icon: Bot,
      },
      {
        title: "接口配置",
        description:
          "当你使用第三方模型服务时，API Key 与 Base URL 决定 Eveheart 应该连接到哪里。",
        icon: Key,
      },
      {
        title: "人设与语言",
        description:
          "人格名称、回复语言和辅助设置会影响系统的表达风格与阅读舒适度。",
        icon: Languages,
      },
    ],
    concepts: [
      {
        title: "什么时候需要配置 API Key？",
        description:
          "如果你使用的是项目内置服务，通常不需要额外填写；如果切换到外部服务商或兼容接口，就需要补充自己的密钥。",
      },
      {
        title: "Base URL 有什么作用？",
        description:
          "它决定请求发往哪个模型服务地址。对于自建代理或兼容 OpenAI 协议的服务，填写正确地址尤其重要。",
      },
    ],
    relatedLinks: [
      { href: "/dashboard/setting/preferences-setting", label: "打开偏好设置" },
      { href: "/dashboard/chat", label: "返回聊天验证风格" },
    ],
    previewTitle: "个性化配置示意",
    previewCaption: "偏好设置更像你的控制台，用来决定模型能力与交互风格。",
    previewItems: [
      "选择提供商",
      "填写密钥 / 地址",
      "设置人设",
      "保存语言与显示偏好",
    ],
  },
  {
    value: "privacy",
    label: "账户与隐私",
    title: "账户与隐私",
    subtitle: "管理密码、安全设置、聊天记录导出与账号注销等关键操作。",
    description:
      "这一部分适合在你正式长期使用 Eveheart 后阅读，了解如何导出数据、调整保留策略，并在需要时安全地结束使用。",
    route: "/dashboard/setting/account-setting",
    icon: ShieldCheck,
    highlights: [
      { label: "安全设置" },
      { label: "导出记录" },
      { label: "注销账号" },
    ],
    steps: [
      {
        title: "修改密码与检查安全信息",
        description:
          "如果你更换设备或共享环境使用过账号，建议先更新密码，确保访问安全。",
      },
      {
        title: "导出聊天记录并做二次脱敏",
        description:
          "导出的 Markdown 适合个人留存或整理复盘。若准备分享，请再次移除姓名、邮箱、地点等敏感信息。",
      },
      {
        title: "按需要清空历史或调整保留策略",
        description:
          "当你希望降低本地保留量或重新开始时，可以使用清空会话与保留策略功能。",
      },
      {
        title: "执行账号注销前先完成备份",
        description:
          "注销通常是不可逆操作。请在删除前确认重要聊天内容已经导出并妥善保存。",
      },
    ],
    panels: [
      {
        title: "密码与身份安全",
        description: "优先保护登录凭证，能降低未经授权访问个人对话内容的风险。",
        icon: Lock,
      },
      {
        title: "数据导出",
        description:
          "聊天历史可以整理成 Markdown，便于你回顾长期情绪变化、话题轨迹与重要节点。",
        icon: Download,
      },
      {
        title: "删除与退出",
        description: "执行清空或注销前，建议先确认是否需要保留记录与下载备份。",
        icon: Trash2,
      },
    ],
    concepts: [
      {
        title: "为什么导出后还建议再次脱敏？",
        description:
          "因为导出文件可能包含你在对话里主动提供的个人信息。若文件将离开当前设备，建议再次检查敏感内容。",
      },
      {
        title: "注销账号与清空聊天记录有什么区别？",
        description:
          "清空聊天记录主要影响会话内容；注销账号则通常意味着结束账户本身的使用，风险更高、不可恢复性也更强。",
      },
    ],
    relatedLinks: [
      { href: "/dashboard/setting/account-setting", label: "打开账户设置" },
      { href: "/dashboard/help/FAQ", label: "继续阅读 FAQ" },
    ],
    previewTitle: "隐私与安全示意",
    previewCaption: "建议把导出、脱敏与注销看作一条连续的安全流程。",
    previewItems: ["更新密码", "导出历史", "二次脱敏", "按需清理或注销"],
  },
];

function HelpBadge({ label, tooltip }: { label: string; tooltip?: string }) {
  if (!tooltip) {
    return <Badge variant="outline">{label}</Badge>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Badge variant="outline" className="cursor-help gap-1.5">
            {label}
            <Info className="size-3" />
          </Badge>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="flex flex-col gap-4">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className="flex gap-4 rounded-2xl border bg-background/80 p-4"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {index + 1}
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-medium text-foreground">{step.title}</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {step.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function PreviewCard({
  title,
  caption,
  items,
}: {
  title: string;
  caption: string;
  items: string[];
}) {
  return (
    <Card className="overflow-hidden border-border/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen className="size-5" />
          </div>
          {title}
        </CardTitle>
        <CardDescription className="leading-6">{caption}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex aspect-[4/3] flex-col justify-between rounded-3xl border bg-gradient-to-br from-primary/8 via-background to-muted p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border bg-background/80 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Visual Placeholder
              </p>
              <p className="mt-3 text-sm font-medium text-foreground">
                帮助内容结构图
              </p>
            </div>
            <div className="rounded-2xl border bg-background/80 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Module Focus
              </p>
              <p className="mt-3 text-sm font-medium text-foreground">
                从理解流程到开始操作
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {items.map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border bg-background/80 px-4 py-3"
              >
                <div className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                  {index + 1}
                </div>
                <p className="text-sm text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ModuleContent({ module }: { module: GuideModule }) {
  const Icon = module.icon;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/70 bg-gradient-to-br from-background via-background to-muted/50">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-6" />
                </div>
                <div className="flex flex-col gap-2">
                  <CardTitle className="text-2xl font-semibold">
                    {module.title}
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-sm leading-7">
                    {module.subtitle}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary">{module.route}</Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {module.highlights.map((highlight) => (
                <HelpBadge
                  key={highlight.label}
                  label={highlight.label}
                  tooltip={highlight.tooltip}
                />
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              {module.description}
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              {module.panels.map((panel) => {
                const PanelIcon = panel.icon;

                return (
                  <div
                    key={panel.title}
                    className="flex flex-col gap-3 rounded-2xl border bg-background/80 p-4"
                  >
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                      <PanelIcon className="size-5" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="font-medium text-foreground">
                        {panel.title}
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {panel.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3">
              {module.relatedLinks.map((link) => (
                <Button key={link.href} asChild variant="outline" size="sm">
                  <Link href={link.href}>
                    {link.label}
                    <ChevronRight data-icon="inline-end" />
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <PreviewCard
          title={module.previewTitle}
          caption={module.previewCaption}
          items={module.previewItems}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Rocket className="size-5" />
              </div>
              操作步骤
            </CardTitle>
            <CardDescription>
              按照这个顺序操作，更容易快速理解该模块的完整体验。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StepList steps={module.steps} />
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Info className="size-5" />
              </div>
              进阶理解
            </CardTitle>
            <CardDescription>
              这些概念不要求你一开始就完全掌握，但知道它们会帮助你更稳地使用
              Eveheart。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {module.concepts.map((concept, index) => (
                <AccordionItem
                  key={concept.title}
                  value={`${module.value}-${index}`}
                >
                  <AccordionTrigger>{concept.title}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {concept.description}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function GuidePage() {
  return (
    <main className="min-h-screen p-5">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-background via-background to-muted/50">
            <CardHeader className="gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Help Center</Badge>
                <Badge variant="outline">5 个核心模块</Badge>
                <Badge variant="outline">视频教程</Badge>
              </div>
              <div className="flex flex-col gap-3">
                <CardTitle className="font-headline text-3xl font-semibold tracking-tight md:text-4xl">
                  Eveheart 使用指南
                </CardTitle>
                <CardDescription className="max-w-3xl text-sm leading-7">
                  这里把注册登录、AI
                  对话、知识库、个性化设置与账户隐私整理成结构化帮助中心。
                  你可以从顶部视频预览进入，也可以直接按下方标签逐项学习。
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <HeroVideoDialog
                  className="block dark:hidden"
                  animationStyle="from-center"
                  videoSrc="/demo.mp4"
                  thumbnailSrc="/thumbnail.jpg"
                  thumbnailAlt="Hero Video"
                />
                <HeroVideoDialog
                  className="hidden dark:block"
                  animationStyle="from-center"
                  videoSrc="/demo.mp4"
                  thumbnailSrc="/thumbnail-dark.jpg"
                  thumbnailAlt="Hero Video"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Compass className="size-5" />
                </div>
                建议阅读顺序
              </CardTitle>
              <CardDescription className="leading-6">
                如果你是第一次进入帮助中心，推荐先按这个顺序浏览，再跳到自己最关心的模块。
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {guideModules.map((module, index) => {
                const Icon = module.icon;

                return (
                  <div
                    key={module.value}
                    className="flex gap-4 rounded-2xl border bg-background/80 p-4"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                      <Icon className="size-5" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">Step {index + 1}</Badge>
                        <p className="font-medium text-foreground">
                          {module.label}
                        </p>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {module.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}

              <div className="rounded-2xl border border-dashed bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
                提示：遇到像{" "}
                <span className="font-medium text-foreground">RAG</span>、
                <span className="font-medium text-foreground"> API Key</span>、
                <span className="font-medium text-foreground"> 流式回复</span>
                这样的术语时，可以先看提示说明，再展开对应模块下方的“进阶理解”。
              </div>
            </CardContent>
          </Card>
        </section>

        <Tabs defaultValue={guideModules[0].value} className="gap-6">
          <TabsList className="w-full justify-start overflow-x-auto rounded-2xl border bg-background p-1">
            {guideModules.map((module) => {
              const Icon = module.icon;

              return (
                <TabsTrigger
                  key={module.value}
                  value={module.value}
                  className="gap-2 px-4 py-2"
                >
                  <Icon className="size-4" />
                  {module.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {guideModules.map((module) => (
            <TabsContent
              key={module.value}
              value={module.value}
              className="outline-none"
            >
              <ModuleContent module={module} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </main>
  );
}
