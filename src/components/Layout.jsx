import { Link, Outlet, useLocation } from 'react-router-dom';
import { Dumbbell, Rss, Users, History } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { path: '/', label: 'Workouts', icon: Dumbbell },
  { path: '/feed', label: 'Feed', icon: Rss },
  { path: '/groups', label: 'Groups', icon: Users },
  { path: '/history', label: 'History', icon: History },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      <div className="w-full max-w-[512px] flex flex-col min-h-screen relative">
        <main className="flex-1 pb-20 overflow-y-auto">
          <Outlet />
        </main>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[512px] z-50 bg-card/90 backdrop-blur-md border-t border-border">
          <div className="flex items-center justify-around px-2 py-2">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    'flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors',
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon
                    size={22}
                    className={cn(active && 'drop-shadow-[0_0_6px_hsl(35_96%_58%/0.8)]')}
                  />
                  <span className="text-[11px] font-medium font-body">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}