import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
