import type { Metadata, Viewport } from 'next';
import { Noto_Sans_JP, Black_Han_Sans, Yuji_Syuku } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { PaletteProvider } from '@/components/layout/PaletteProvider';
import { Toaster } from '@/components/ui/sonner';

const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-jp',
  subsets: ['latin'],
  weight: ['200', '400', '500', '700'],
  display: 'swap',
});

// 학습 대상인 일본어 글자에만 쓰는 붓글씨체. UI 텍스트는 Noto Sans JP 그대로 둔다.
const yujiSyuku = Yuji_Syuku({
  variable: '--font-brush',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

// 한글 학습 서체 — 배달의민족 을지로체 (OFL-1.1). node_modules 에서 self-host 한다.
// 손으로 그린 간판 획이라 일본어 붓글씨(Yuji Syuku)와 결이 맞는다.
const bmEuljiro = localFont({
  src: '../node_modules/@kfonts/bm-euljiro/BMEULJIROTTF.woff2',
  variable: '--font-ko-euljiro',
  display: 'swap',
});

const blackHanSans = Black_Han_Sans({
  variable: '--font-black-han-sans',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#4f46e5',
};

export const metadata: Metadata = {
  title: '일본어 퀴즈',
  description: '이미지 업로드만으로 시작하는 일본어 학습',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '일본어 퀴즈',
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${notoSansJP.variable} ${blackHanSans.variable} ${yujiSyuku.variable} ${bmEuljiro.variable} h-full`} suppressHydrationWarning>
      <head>
        <script
          // 하이드레이션 전에 팔레트를 적용한다. 없으면 기본 팔레트로 한 프레임 깜빡인다.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('jp-quiz-settings');var p=s&&JSON.parse(s).state&&JSON.parse(s).state.palette;document.documentElement.dataset.palette=p||'sumi';}catch(e){document.documentElement.dataset.palette='sumi';}})();`,
          }}
        />
      </head>
      <body className="min-h-full bg-background font-sans antialiased">
        <ThemeProvider>
          <PaletteProvider>
            <ResponsiveLayout>{children}</ResponsiveLayout>
            <Toaster />
          </PaletteProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
