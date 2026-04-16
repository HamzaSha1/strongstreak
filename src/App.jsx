import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { lazy, Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
// Add page imports here
const Workouts = lazy(() => import('@/pages/Workouts'));
const Feed = lazy(() => import('@/pages/Feed'));
const Groups = lazy(() => import('@/pages/Groups'));
const History = lazy(() => import('@/pages/History'));
const Progress = lazy(() => import('@/pages/Progress'));
const SplitBuilder = lazy(() => import('@/pages/SplitBuilder'));
const ActiveWorkout = lazy(() => import('@/pages/ActiveWorkout'));
const People = lazy(() => import('@/pages/People'));
const Profile = lazy(() => import('@/pages/Profile'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Terms = lazy(() => import('@/pages/Terms'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

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
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
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
      </motion.div>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <QueryClientProvider client={queryClientInstance}>
          <AuthProvider>
            <AuthenticatedApp />
            <Toaster />
          </AuthProvider>
        </QueryClientProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App