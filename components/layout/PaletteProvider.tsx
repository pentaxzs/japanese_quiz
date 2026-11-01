'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settings-store';
import type { PaletteId } from '@/lib/types';

/**
 * 팔레트를 <html data-palette="..."> 로 반영한다.
 *
 * 색값 자체는 전부 app/globals.css 에 있다. 여기서 인라인 스타일로
 * 토큰을 덮어쓰면 클래스 기반 규칙(.dark 포함)보다 우선해버려서
 * 다크 모드 토글이 색을 바꾸지 못하게 된다 — 이전 구현의 버그였다.
 * 이 컴포넌트는 속성 하나만 쓴다. 라이트/다크는 next-themes 가 소유한다.
 */
export const PALETTES: { id: PaletteId; label: string; hint: string }[] = [
  { id: 'sumi', label: '먹', hint: '무채색에 주홍 한 점' },
  { id: 'ai', label: '쪽', hint: '쪽빛 남색에 금빛' },
  { id: 'sand', label: '모래', hint: '따뜻한 종이색' },
];

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const { palette, fontSize } = useSettingsStore();

  useEffect(() => {
    document.documentElement.dataset.palette = palette;
  }, [palette]);

  useEffect(() => {
    document.documentElement.style.fontSize = fontSize === 'large' ? '18px' : '16px';
  }, [fontSize]);

  return <>{children}</>;
}
