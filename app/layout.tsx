import type { Metadata, Viewport } from 'next';
import { Noto_Sans_JP, Black_Han_Sans } from 'next/font/google';
import './globals.css';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { PaletteProvider } from '@/components/layout/PaletteProvider';
import { Toaster } from '@/components/ui/sonner';

const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-jp',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
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
    <html lang="ko" className={`${notoSansJP.variable} ${blackHanSans.variable} h-full`} suppressHydrationWarning>
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
