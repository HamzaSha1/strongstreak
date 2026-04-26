import { Link, Outlet, useLocation } from 'react-router-dom';
import { Dumbbell, Rss, Users, History, UserSearch, TrendingUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { base44 } from '@/api/base44Client';
import { useActiveWorkout } from '@/lib/ActiveWorkoutContext';
import { getReminderEnabled, getReminderTime, scheduleWeightReminder } from '@/lib/notifications';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';

const ActiveWorkout = lazy(() => import('@/pages/ActiveWorkout'));

function getContrastColor(hex) {
  if (!hex) return null;
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? 'black' : 'white';
}


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
  const { activeDayId } = useActiveWorkout();
  const location = useLocation();
  const { user } = useAuth();

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['incomingFollowRequests', user?.email],
    queryFn: () => base44.entities.FollowRequest.filter({ target_id: user.email, status: 'pending' }),
    enabled: !!user,
    staleTime: 30_000,
  });
  const hasPendingRequests = pendingRequests.length > 0;
  const [scrollPositions, setScrollPositions] = useState({});
  const [prevPath, setPrevPath] = useState(location.pathname);
  const mainRef = useRef(null);
  const [bgColor, setBgColor] = useState(null);

  // Reschedule daily weight reminder every time the app opens
  useEffect(() => {
    if (getReminderEnabled()) {
      scheduleWeightReminder(getReminderTime());
    }
  }, []);

  useEffect(() => {
    let unsubscribe;
    base44.auth.me().then(async (user) => {
      if (!user) return;
      const profiles = await base44.entities.Profile.filter({ user_id: user.email });
      const profileId = profiles[0]?.id;
      setBgColor(profiles[0]?.bg_color || null);
      if (profileId) {
        unsubscribe = base44.entities.Profile.subscribe((event) => {
          if (event.id === profileId) {
            setBgColor(event.data?.bg_color || null);
          }
        });
      }
    }).catch(() => {});
    return () => unsubscribe?.();
  }, []);

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
  }, [location.pathname]);  

  const contrastColor = bgColor ? getContrastColor(bgColor) : null;
  const isDark = contrastColor === 'white';

  // Build HSL-compatible variable overrides injected into :root when bg_color is active
  const dynamicCssVars = bgColor ? `
    :root {
      --foreground: ${isDark ? '0 0% 98%' : '222 18% 7%'};
      --muted-foreground: ${isDark ? '0 0% 60%' : '222 18% 40%'};
      --card-foreground: ${isDark ? '0 0% 95%' : '222 18% 7%'};
      --popover-foreground: ${isDark ? '0 0% 95%' : '222 18% 7%'};
      --secondary-foreground: ${isDark ? '0 0% 90%' : '222 18% 16%'};
      --card: ${isDark ? '0 0% 100% / 0.07' : '222 18% 7% / 0.06'};
      --muted: ${isDark ? '0 0% 100% / 0.07' : '222 18% 7% / 0.05'};
      --secondary: ${isDark ? '0 0% 100% / 0.10' : '222 18% 7% / 0.08'};
      --border: ${isDark ? '0 0% 100% / 0.14' : '222 18% 7% / 0.12'};
      --input: ${isDark ? '0 0% 100% / 0.08' : '222 18% 7% / 0.07'};
      --primary-foreground: 222 18% 7%;
      --destructive-foreground: 0 0% 98%;
      --accent-foreground: 222 18% 7%;
    }
  ` : '';

  const dynamicStyle = bgColor ? { backgroundColor: bgColor } : {};

  return (
    <>
      {dynamicCssVars && <style>{dynamicCssVars}</style>}
      {/* Permanent status bar cover — always sits on top, prevents any content bleeding behind iOS status bar */}
      <div
        className="fixed top-0 left-0 right-0 z-[999] bg-background"
        style={{ height: 'env(safe-area-inset-top)' }}
      />
      <div className="flex flex-col items-center" style={{ height: '100dvh', ...dynamicStyle }}>
        <div className="w-full max-w-[512px] flex flex-col h-full" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <main ref={mainRef} className="flex-1 min-h-0 overflow-y-auto pb-[70px]" onScroll={handleMainScroll}>
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
                    <div className="relative">
                      <Icon
                        size={22}
                        className={cn(active && 'drop-shadow-[0_0_6px_hsl(35_96%_58%/0.8)]')}
                      />
                      {path === '/profile' && hasPendingRequests && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-card" />
                      )}
                    </div>
                    <span className="text-[11px] font-medium font-body">{label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>

      {/* Persistent active workout overlay — survives page navigation */}
      {activeDayId && (
        <Suspense fallback={null}>
          <ActiveWorkout dayId={activeDayId} />
        </Suspense>
      )}
    </>
  );
}