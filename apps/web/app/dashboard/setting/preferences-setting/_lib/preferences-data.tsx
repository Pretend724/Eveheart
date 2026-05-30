import { KeyIcon } from "lucide-react";
import { DeepSeek, OpenAI, SiliconCloud } from "@lobehub/icons";
import type { AvatarIdentifier, Provider } from "./preferences-types";

export const PROVIDERS: {
  id: Provider;
  name: string;
  desc: string;
  badge: string | null;
  models: string[];
  builtin: boolean;
  icon: React.ReactNode;
}[] = [
  {
    id: "siliconflow",
    name: "siliconflow",
    desc: "内置服务，即开即用，无需配置",
    badge: "默认",
    models: [
      "Pro/MiniMaxAI/MiniMax-M2.5",
      "Pro/deepseek-ai/DeepSeek-V3.2",
      "Qwen/Qwen3.5-397B-A17B",
      "Pro/moonshotai/Kimi-K2.5",
    ],
    builtin: true,
    icon: <SiliconCloud.Color className="size-4" />,
  },
  {
    id: "openai",
    name: "OpenAI",
    desc: "GPT-4o · GPT-4o-mini · o1 系列",
    badge: null,
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1-mini"],
    builtin: false,
    icon: <OpenAI className="size-4" />,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    desc: "deepseek-chat · deepseek-reasoner",
    badge: null,
    models: ["deepseek-chat", "deepseek-reasoner"],
    builtin: false,
    icon: <DeepSeek.Color className="size-4" />,
  },
  {
    id: "custom",
    name: "自定义接口",
    desc: "兼容 OpenAI 协议的任意服务",
    badge: "进阶",
    models: [],
    builtin: false,
    icon: <KeyIcon className="size-4" />,
  },
];

export const AVATAR_OPTIONS: {
  id: AvatarIdentifier;
  name: string;
  imageSrc: string;
  description: string;
}[] = [
  {
    id: "muxin",
    name: "沐心",
    imageSrc: "/muxin.jpg",
    description: "温和亲切，适合更柔和的陪伴氛围。",
  },
  {
    id: "muchen",
    name: "沐辰",
    imageSrc: "/muchen.jpg",
    description: "沉稳清晰，适合更利落的交流体验。",
  },
];
