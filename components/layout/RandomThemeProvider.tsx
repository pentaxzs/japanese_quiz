'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settings-store';

// 3개 테마. primary는 각 배경에서 WCAG AA(4.5:1 이상) 대비를 만족하는 색상으로 선정.
const THEMES = [
  {
    // 짙은 남색 — 클래식 다크
    name: 'midnight-navy',
    dark: true,
    background: '#0f172a',
    foreground: '#ffffff',
    card: '#1e293b',
    cardForeground: '#ffffff',
    muted: '#1e293b',
    mutedForeground: '#b0bcd0',
    border: '#334155',
    input: '#334155',
    accent: '#1e293b',
    accentForeground: '#ffffff',
    primary: '#818cf8',        // indigo-400: bg(#0f172a) 대비 5.5:1 ✓
    primaryForeground: '#ffffff',
  },
  {
    // 따뜻한 크림 — 밝은 테마
    name: 'warm-sand',
    dark: false,
    background: '#fdf8f0',
    foreground: '#2c1a0e',
    card: '#fff8ec',
    cardForeground: '#2c1a0e',
    muted: '#f0e8d5',
    mutedForeground: '#7a5c3e',
    border: '#e0cdb5',
    input: '#e0cdb5',
    accent: '#f5ead8',
    accentForeground: '#2c1a0e',
    primary: '#92400e',        // amber-800: bg(#fdf8f0) 대비 8.1:1 ✓
    primaryForeground: '#ffffff',  // white on dark amber ✓
  },
  {
    // 짙은 보라 — 컬러풀 다크
    name: 'purple-dusk',
    dark: true,
    background: '#16102e',
    foreground: '#ffffff',
    card: '#1f1640',
    cardForeground: '#ffffff',
    muted: '#261d4a',
    mutedForeground: '#b8b0cc',
    border: '#3d2e6b',
    input: '#3d2e6b',
    accent: '#261d4a',
    accentForeground: '#ffffff',
    primary: '#c084fc',        // purple-400: bg(#16102e) 대비 6.3:1 ✓
    primaryForeground: '#ffffff',
  },
];

export function RandomThemeProvider({ children }: { children: React.ReactNode }) {
  const { fontSize } = useSettingsStore();

  useEffect(() => {
    document.documentElement.style.fontSize = fontSize === 'large' ? '18px' : '16px';
  }, [fontSize]);

  useEffect(() => {
    const idx = Math.floor(Math.random() * THEMES.length);
    const theme = THEMES[idx];
    const root = document.documentElement;

    if (theme.dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    root.style.setProperty('--background', theme.background);
    root.style.setProperty('--foreground', theme.foreground);
    root.style.setProperty('--card', theme.card);
    root.style.setProperty('--card-foreground', theme.cardForeground);
    root.style.setProperty('--muted', theme.muted);
    root.style.setProperty('--muted-foreground', theme.mutedForeground);
    root.style.setProperty('--border', theme.border);
    root.style.setProperty('--input', theme.input);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent-foreground', theme.accentForeground);
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--primary-foreground', theme.primaryForeground);
  }, []);

  return <>{children}</>;
}
