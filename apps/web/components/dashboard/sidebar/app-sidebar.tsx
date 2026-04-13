"use client";

import * as React from "react";
import { type User } from "next-auth";

import { NavMain } from "@/components/dashboard/sidebar/nav-main";
import { NavSecondary } from "@/components/dashboard/sidebar/nav-secondary";
import { NavUser } from "@/components/dashboard/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  ActivityIcon,
  BookOpenIcon,
  HomeIcon,
  MessageSquareHeartIcon,
  Settings2Icon,
  LifeBuoyIcon,
  SendIcon,
  HeartHandshakeIcon,
  Database,
} from "lucide-react";
import { Logo } from "@/components/logo";

const data = {
  navMain: [
    // {
    //   title: "控制台总览",
    //   url: "#",
    //   icon: <HomeIcon />,
    //   items: [
    //     {
    //       title: "首页",
    //       url: "/dashboard",
    //     },
    //   ],
    // },
    {
      title: "AI陪护",
      url: "#",
      icon: <HeartHandshakeIcon />,
      isActive: true,
      items: [
        {
          title: "即时对话",
          url: "/dashboard/chat",
        },
        {
          title: "数字人交互",
          url: "/dashboard/chat/AI-avatar",
        },
      ],
    },
    {
      title: "知识库",
      url: "/dashboard/knowledge-base",
      icon: <Database />,
    },
    {
      title: "情绪洞察",
      url: "/dashboard/emotion/emotion-insight",
      icon: <MessageSquareHeartIcon />,
    },
    {
      title: "内容与帮助",
      url: "#",
      icon: <BookOpenIcon />,
      items: [
        {
          title: "使用指南",
          url: "/dashboard/help/guide",
        },
        {
          title: "常见问题",
          url: "/dashboard/help/FAQ",
        },
      ],
    },
    {
      title: "系统设置",
      url: "#",
      icon: <Settings2Icon />,
      items: [
        {
          title: "账户设置",
          url: "/dashboard/setting/account-setting",
        },
        {
          title: "偏好配置",
          url: "/dashboard/setting/preferences-setting",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "帮助支持",
      url: "/",
      icon: <LifeBuoyIcon />,
    },
    {
      title: "反馈建议",
      url: "/",
      icon: <SendIcon />,
    },
    {
      title: "关于 Eveheart",
      url: "https://github.com/Pretend724/Eveheart",
      icon: <ActivityIcon />,
    },
  ],
};

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user?: User }) {
  const navUser = {
    name: user?.name || "Eveheart 用户",
    email: user?.email || "",
    avatar: user?.image || "",
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div>
                <Logo></Logo>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
