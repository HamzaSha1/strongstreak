import { Link, Outlet, useLocation } from 'react-router-dom';
import { Dumbbell, Rss, Users, History, UserSearch, TrendingUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

const NAV_ITEMS = [
  { path: '/', label: 'Workouts', icon: Dumbbell },
  { path: '/feed', label: 'Feed', icon: Rss },
  { path: '/people', label: 'People', icon: UserSearch },
  { path: '/groups', label: 'Groups', icon: Users },
  { path: '/history', label: 'History', icon: History },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function Layout() {
  const location = useLocation();
  const [scrollPositions, setScrollPositions] = useState({});
  const [prevPath, setPrevPath] = useState(location.pathname);
  const mainRef = useRef(null);

  const handleMainScroll = () => {
    if (mainRef.current) {
      setScrollPositions((prev) => ({
        ...prev,
        [location.pathname]: mainRef.current.scrollTop,
      }));
    }
  };

  useEffect(() => {
    const currentPath = location.pathname;
    
    // If clicking the same tab, reset to root (top of scroll)
    if (prevPath === currentPath && mainRef.current) {
      mainRef.current.scrollTop = 0;
    } else {
      // Switching tabs - restore scroll position
      if (mainRef.current && scrollPositions[currentPath] !== undefined) {
        setTimeout(() => {
          if (mainRef.current) mainRef.current.scrollTop = scrollPositions[currentPath];
        }, 0);
      }
    }
    
    setPrevPath(currentPath);
  }, [location.pathname, scrollPositions]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      <div className="w-full max-w-[512px] flex flex-col min-h-screen relative" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <main ref={mainRef} className="flex-1 pb-24 overflow-y-auto" onScroll={handleMainScroll}>
          <Outlet />
        </main>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[512px] z-50 bg-card border-t border-border rounded-t-2xl" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
          <div className="flex items-center justify-around px-2 py-2">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link
                   key={path}
                   to={path}
                   className={cn(
                     'flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors -m-2 p-2',
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