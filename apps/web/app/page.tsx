import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <main className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            <span className="text-primary">Eveheart</span>
          </h1>
          <p className="text-xl text-muted-foreground md:text-2xl">
            AI情感陪护虚拟数字人系统
          </p>
          <p className="max-w-2xl text-lg text-muted-foreground">
            通过语音、视频、文本多模态数据识别用户心理状态，
            由虚拟数字人进行情绪回应和心理陪伴
          </p>
        </div>

        <div className="flex gap-4">
          <Link href="/login">
            <Button size="lg" variant="default">
              登录
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline">
              注册
            </Button>
          </Link>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          <FeatureCard
            title="数字人陪伴"
            description="真实的虚拟数字人形象，提供温暖的陪伴体验"
            icon="👤"
          />
          <FeatureCard
            title="语音对话"
            description="自然流畅的语音交互，就像和朋友聊天一样"
            icon="🎤"
          />
          <FeatureCard
            title="情绪识别"
            description="通过多模态AI识别用户的情绪状态"
            icon="❤️"
          />
          <FeatureCard
            title="心理陪伴"
            description="专业的心理支持，温柔的情绪引导"
            icon="🤗"
          />
          <FeatureCard
            title="隐私安全"
            description="您的数据安全是我们的首要任务"
            icon="🔒"
          />
          <FeatureCard
            title="随时随地"
            description="24/7 全天候陪伴，随时为您服务"
            icon="⏰"
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md">
      <div className="text-4xl">{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
