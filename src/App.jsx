import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout';
import { ActiveWorkoutProvider } from '@/lib/ActiveWorkoutContext';
import ErrorBoundary from '@/components/ErrorBoundary';
// Core tab pages — bundled directly so tab navigation is instant
import Workouts from '@/pages/Workouts';
import Feed from '@/pages/Feed';
import Groups from '@/pages/Groups';
import History from '@/pages/History';
import Progress from '@/pages/Progress';
import People from '@/pages/People';
import Profile from '@/pages/Profile';
// Secondary pages — lazy loaded as they are rarely accessed
const SplitBuilder = lazy(() => import('@/pages/SplitBuilder'));
const ActiveWorkout = lazy(() => import('@/pages/ActiveWorkout'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Terms = lazy(() => import('@/pages/Terms'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const LN = window.Capacitor?.Plugins?.LocalNotifications;
    if (!LN) return;
    const handle = LN.addListener('localNotificationActionPerformed', (notificationAction) => {
      const url = notificationAction.notification.extra?.url;
      if (url) navigate(url);
    });
    return () => { handle?.remove?.(); };
  }, [navigate]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    }>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Workouts />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/people" element={<People />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/history" element={<History />} />
          <Route path="/progress" element={<Progress />} />
        </Route>
        <Route path="/split-builder" element={<SplitBuilder />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/workout/:dayId" element={<ActiveWorkout />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <QueryClientProvider client={queryClientInstance}>
          <AuthProvider>
            <ActiveWorkoutProvider>
              <AuthenticatedApp />
              <Toaster />
            </ActiveWorkoutProvider>
          </AuthProvider>
        </QueryClientProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App