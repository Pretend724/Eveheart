"use client";

import * as React from "react";
import { type User } from "next-auth";
import { usePathname } from "next/navigation";

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
    {
      title: "AI陪护",
      url: "#",
      icon: <HeartHandshakeIcon />,
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

function isPathActive(pathname: string, href: string) {
  if (!href || href === "#") {
    return false;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getLongestMatchedHref(
  pathname: string,
  hrefs: string[],
) {
  const matches = hrefs.filter((href) => isPathActive(pathname, href));
  if (matches.length === 0) {
    return null;
  }

  return matches.reduce((longest, current) =>
    current.length > longest.length ? current : longest,
  );
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user?: User }) {
  const pathname = usePathname();

  const navUser = {
    name: user?.name || "Eveheart 用户",
    email: user?.email || "",
    avatar: user?.image || "",
  };

  const navMainItems = React.useMemo(() => {
    return data.navMain.map((item) => {
      const longestMatchedSubItemHref = item.items
        ? getLongestMatchedHref(
            pathname,
            item.items.map((subItem) => subItem.url),
          )
        : null;

      const items =
        item.items?.map((subItem) => ({
          ...subItem,
          isActive: subItem.url === longestMatchedSubItemHref,
        })) ?? undefined;

      const isActive = items
        ? items.some((subItem) => subItem.isActive)
        : isPathActive(pathname, item.url);

      return {
        ...item,
        isActive,
        items,
      };
    });
  }, [pathname]);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div>
                <Logo />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
