import type { Metadata, Viewport } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';

const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-jp',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
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
    <html lang="ko" className={`${notoSansJP.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-background font-sans antialiased">
        <ThemeProvider>
          <ResponsiveLayout>{children}</ResponsiveLayout>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
