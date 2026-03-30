import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UsernameForm } from "@/components/dashboard/account-setting/username-form";
import { PasswordForm } from "@/components/dashboard/account-setting/password-form";
import { DataPrivacyActions } from "@/components/dashboard/account-setting/data-privacy-actions";
import { RetentionPolicyForm } from "@/components/dashboard/account-setting/retention-policy-form";

export default async function AccountSettingPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, retentionPolicy: true },
  });

  if (!user) {
    redirect("/login");
  }

  const chatSessions = await prisma.chatSession.findMany({
    where: { userId: session.user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  const exportMarkdownLines = [
    "# Eveheart 个人数据导出",
    "",
    `- 用户名: ${user.name ?? "未设置"}`,
    `- 邮箱: ${user.email}`,
    `- 导出时间: ${new Date().toISOString()}`,
    `- 会话数量: ${chatSessions.length}`,
    "",
    "## 对话记录",
    "",
  ];

  for (const chatSession of chatSessions) {
    exportMarkdownLines.push(
      `### 会话 ${chatSession.id}`,
      `- 创建时间: ${chatSession.createdAt.toISOString()}`,
      `- 消息数量: ${chatSession.messages.length}`,
      "",
    );

    for (const message of chatSession.messages) {
      const text = Array.isArray(message.parts)
        ? message.parts
            .filter(
              (part): part is { type: "text"; text: string } =>
                typeof part === "object" &&
                part !== null &&
                "type" in part &&
                "text" in part &&
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (part as any).type === "text" &&
                typeof (part as { text: unknown }).text === "string",
            )
            .map((part) => part.text)
            .join("")
        : "";

      const roleLabel = message.role === "assistant" ? "助手" : "用户";

      exportMarkdownLines.push(
        `**${roleLabel}:** ${text || "(无文本内容)"}`,
        "",
      );
    }
  }

  const exportMarkdown = exportMarkdownLines.join("\n");

  return (
    <main className="p-5 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="mb-12">
          <h3 className="font-headline text-4xl font-extrabold text-foreground tracking-tight">
            账户设置
          </h3>
        </div>

        {/* Section 1: User Profile Card */}
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative group">
                <Avatar className="w-32 h-32 border-2 border-primary/30">
                  <AvatarImage src="#" alt="用户头像" />
                  <AvatarFallback className="text-xl">
                    {user.name?.charAt(0) ?? user.email?.charAt(0) ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <UsernameForm initialName={user.name ?? ""} email={user.email} />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Security Settings Card */}
        <Card>
          <CardHeader className="pb-6">
            <CardTitle>安全与认证</CardTitle>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>

        {/* Section 3: Data & Privacy Card */}
        <Card>
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-xl">
              数据与隐私控制
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <RetentionPolicyForm
                initialRetentionPolicy={user.retentionPolicy}
              />
              <DataPrivacyActions exportMarkdown={exportMarkdown} />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Account Management Card */}
        <Card className="border-destructive/20">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="material-symbols-outlined text-destructive"
                    data-icon="warning"
                  >
                    warning
                  </span>
                  <h4 className="font-headline text-xl font-bold text-foreground">
                    高风险操作
                  </h4>
                </div>
                <p className="text-muted-foreground text-sm max-w-xl">
                  删除账号为永久操作。你的情绪模式、对话历史与洞察数据将从
                  Eveheart 安全服务器中立即清除，且无法恢复。
                </p>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <Button
                  variant="destructive"
                  className="flex-1 md:flex-none px-6 py-3 h-auto font-bold"
                >
                  删除账号
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
