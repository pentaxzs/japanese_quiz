import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
