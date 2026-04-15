import { redirect } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { UsernameForm } from "@/components/dashboard/account-setting/username-form";
import { PasswordForm } from "@/components/dashboard/account-setting/password-form";
import { DataPrivacyActions } from "@/components/dashboard/account-setting/data-privacy-actions";
import { RetentionPolicyForm } from "@/components/dashboard/account-setting/retention-policy-form";
import { DeleteAccountAction } from "@/components/dashboard/account-setting/delete-account-action";
import { FamilyManagementSection } from "@/components/dashboard/account-setting/family-management-section";

export default async function AccountSettingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [user, chatSessions, preferences, asElderRelationships, asFamilyRelationships] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, image: true, retentionPolicy: true },
      }),
      prisma.chatSession.findMany({
        where: { userId: session.user.id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.userPreferences
        .findUnique({
          where: { userId: session.user.id },
          select: { elderlyMode: true, highContrast: true },
        })
        .catch(() => null),
      prisma.familyRelationship.findMany({
        where: {
          elderId: session.user.id,
          status: "ACCEPTED",
        },
        orderBy: { createdAt: "desc" },
        include: {
          familyMember: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      }),
      prisma.familyRelationship.findMany({
        where: {
          familyMemberId: session.user.id,
          status: { in: ["PENDING", "ACCEPTED"] },
        },
        orderBy: { createdAt: "desc" },
        include: {
          elder: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      }),
    ]);

  if (!user) {
    redirect("/login");
  }

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

      exportMarkdownLines.push(`**${roleLabel}:** ${text || "(无文本内容)"}`, "");
    }
  }

  const exportMarkdown = exportMarkdownLines.join("\n");

  const pendingInvites = asFamilyRelationships
    .filter((relationship) => relationship.status === "PENDING")
    .map((relationship) => ({
      relationshipId: relationship.id,
      elderId: relationship.elder.id,
      elderName: relationship.elder.name,
      elderEmail: relationship.elder.email,
      elderImage: relationship.elder.image,
      createdAt: relationship.createdAt.toISOString(),
    }));

  const connectedElders = asFamilyRelationships
    .filter((relationship) => relationship.status === "ACCEPTED")
    .map((relationship) => ({
      relationshipId: relationship.id,
      elderId: relationship.elder.id,
      elderName: relationship.elder.name,
      elderEmail: relationship.elder.email,
      elderImage: relationship.elder.image,
      confirmedAt: relationship.confirmedAt?.toISOString() ?? null,
    }));

  const invitedFamilyMembers = asElderRelationships.map((relationship) => ({
    relationshipId: relationship.id,
    familyMemberId: relationship.familyMember.id,
    name: relationship.familyMember.name,
    email: relationship.familyMember.email,
    image: relationship.familyMember.image,
    confirmedAt: relationship.confirmedAt?.toISOString() ?? null,
  }));

  return (
    <main className="min-h-screen p-5">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="space-y-2">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight">
            账户设置
          </h1>
          <p className="text-muted-foreground">
            管理您的账户资料、隐私操作，以及基于亲属授权的家属协同能力。
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-start gap-8 md:flex-row">
              <Avatar className="size-28 border border-primary/20">
                <AvatarImage src={user.image ?? ""} alt={user.name ?? user.email} />
                <AvatarFallback className="text-xl">
                  {(user.name ?? user.email).slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <UsernameForm initialName={user.name ?? ""} email={user.email} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-6">
            <CardTitle>安全与认证</CardTitle>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-6">
            <CardTitle>家属管理</CardTitle>
          </CardHeader>
          <CardContent>
            <FamilyManagementSection
              preferences={{
                elderlyMode: preferences?.elderlyMode ?? false,
                highContrast: preferences?.highContrast ?? false,
              }}
              invitedFamilyMembers={invitedFamilyMembers}
              pendingInvites={pendingInvites}
              connectedElders={connectedElders}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-6">
            <CardTitle>数据与隐私</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-10 md:grid-cols-2">
              <RetentionPolicyForm initialRetentionPolicy={user.retentionPolicy} />
              <DataPrivacyActions exportMarkdown={exportMarkdown} />
            </div>
          </CardContent>
        </Card>

        <Item variant="muted">
          <ItemMedia variant="icon">
            <TriangleAlert className="text-destructive" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>高风险操作</ItemTitle>
            <ItemDescription>
              删除账户是不可逆操作。您的会话记录、偏好配置以及与家属绑定相关的核心数据将被一并清除。
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <DeleteAccountAction />
          </ItemActions>
        </Item>
      </div>
    </main>
  );
}
