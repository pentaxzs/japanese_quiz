'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, AlertCircle, Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useSettingsStore } from '@/store/settings-store';
import type { QuizLanguage } from '@/lib/types';

const EMOJIS_JP = ['🍙', '🍜', '🍣', '🇯🇵', '🍥'];
const EMOJIS_EN = ['📚', '✏️', '🌍', '💬', '🎓'];

const navItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/library', label: '단어장', icon: BookOpen },
  { href: '/wrong-notes', label: '오답 노트', icon: AlertCircle },
  { href: '/settings', label: '설정', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { quizLanguage, setQuizLanguage, fontSize, setFontSize } = useSettingsStore();
  const [emoji, setEmoji] = useState('');

  useEffect(() => {
    const pool = quizLanguage === 'english' ? EMOJIS_EN : EMOJIS_JP;
    setEmoji(pool[Math.floor(Math.random() * pool.length)]);
  }, [quizLanguage]);

  return (
    <aside className="hidden w-56 shrink-0 border-r md:flex md:flex-col">
      <div className="p-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 outline-none">
              <h1 className="text-lg font-bold text-foreground">
                {emoji} {quizLanguage === 'english' ? '영어 퀴즈' : '일본어 퀴즈'}
              </h1>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                <ChevronDown className="h-3 w-3 text-indigo-600 dark:text-indigo-300" />
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {([['japanese', '🇯🇵 일본어 퀴즈'], ['english', '🌍 영어 퀴즈']] as [QuizLanguage, string][]).map(([lang, label]) => (
              <DropdownMenuItem
                key={lang}
                className={`gap-2 ${quizLanguage === lang ? 'font-semibold text-indigo-600 dark:text-indigo-300' : ''}`}
                onClick={() => setQuizLanguage(lang)}
              >
                {label}
                {quizLanguage === lang && <span className="ml-auto text-indigo-500">✓</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <nav className="flex-1 px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Font size toggle */}
      <div className="px-4 py-4 border-t border-border">
        <p className="mb-2 text-xs text-muted-foreground">폰트 크기</p>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(['default', 'large'] as const).map((size) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
                fontSize === size
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {size === 'default' ? '기본' : '크게'}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
