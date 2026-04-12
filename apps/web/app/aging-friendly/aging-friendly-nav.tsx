'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageCircleIcon,
  BotIcon,
  BookOpenIcon,
  Settings2Icon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/aging-friendly/chat', icon: MessageCircleIcon, label: 'AI 对话' },
  { href: '/aging-friendly/avatar', icon: BotIcon, label: '数字人' },
  { href: '/aging-friendly/help', icon: BookOpenIcon, label: '内容帮助' },
  { href: '/aging-friendly/settings', icon: Settings2Icon, label: '设置' },
] as const;

export default function AgingFriendlyNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-20 bg-background/95 backdrop-blur-md border-t border-border"
      aria-label="主导航"
    >
      <div className="grid grid-cols-4 max-w-2xl mx-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 py-3 px-1',
                'transition-colors select-none',
                isActive
                  ? 'text-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
              )}
            >
              <Icon
                className="size-8 shrink-0"
                strokeWidth={isActive ? 2.5 : 1.75}
                aria-hidden="true"
              />
              <span className="text-sm font-semibold leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
