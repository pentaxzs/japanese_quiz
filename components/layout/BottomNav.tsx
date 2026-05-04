'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, AlertCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '메뉴', icon: Home },
  { href: '/library', label: '단어장', icon: BookOpen },
  { href: '/wrong-notes', label: '오답', icon: AlertCircle },
  { href: '/settings', label: '설정', icon: Settings },
];

function isActiveTab(href: string, pathname: string): boolean {
  if (href === '/') {
    // 홈: 루트 또는 일반 덱 퀴즈
    return pathname === '/' || (pathname.startsWith('/quiz/') && pathname !== '/quiz/wrong-notes');
  }
  if (href === '/wrong-notes') {
    // 오답: 오답 페이지 또는 오답 퀴즈
    return pathname === '/wrong-notes' || pathname === '/quiz/wrong-notes';
  }
  return pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background safe-area-bottom md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = isActiveTab(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-w-[44px] flex-col items-center justify-center gap-1 px-3 py-2 text-xs transition-colors',
                isActive ? 'text-indigo-600' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className={cn(
                'flex items-center justify-center rounded-full w-10 h-6 transition-colors',
                isActive && 'bg-indigo-100 dark:bg-indigo-950'
              )}>
                <Icon className="h-5 w-5" />
              </span>
              <span className={cn('font-medium', isActive && 'font-semibold')}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
