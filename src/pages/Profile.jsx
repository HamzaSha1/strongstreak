import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Grid3X3, Settings, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import PostGrid from '@/components/profile/PostGrid';
import ProfileSettings from '@/components/profile/ProfileSettings';
import FollowRequests from '@/components/people/FollowRequests';

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('posts');

  const { data: profile = null } = useQuery({
    queryKey: ['profile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.Profile.filter({ user_id: user.email });
      return profiles[0] ?? { user_id: user.email, display_name: user.full_name || '', avatar_url: '', is_private: false };
    },
    enabled: !!user,
  });

  // setProfile writes back into the query cache so ProfileSettings can update it optimistically
  const setProfile = (newProfile) => queryClient.setQueryData(['profile', user?.email], newProfile);

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['incomingFollowRequests', user?.email],
    queryFn: () => base44.entities.FollowRequest.filter({ target_id: user.email, status: 'pending' }),
    enabled: !!user,
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['myPosts', user?.email],
    queryFn: () => base44.entities.Post.filter({ user_id: user.email }, '-created_date', 50),
    enabled: !!user,
  });

  const tabs = [
    { id: 'posts', label: 'Posts', icon: Grid3X3 },
    { id: 'requests', label: 'Requests', icon: Bell, badge: pendingRequests.length },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Fixed top section — profile summary + tabs, never scrolls */}
      <div className="shrink-0">
        {/* Header */}
        <div className="px-4 pb-2" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
          <h1 className="font-heading font-bold text-2xl">Profile</h1>
        </div>

        {/* Profile summary */}
        {user && profile && (
          <div className="flex flex-col items-center pt-4 pb-6 px-4 gap-2">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-primary font-heading font-bold text-2xl">{user.full_name?.[0]?.toUpperCase() || '?'}</span>
              }
            </div>
            <p className="font-heading font-bold text-lg">{user.full_name}</p>
            {profile?.handle && <p className="text-sm text-primary font-medium">@{profile.handle}</p>}
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span><strong className="text-foreground">{posts.length}</strong> posts</span>
              {profile.is_private && <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Private</span>}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="relative">
                  <Icon size={16} />
                  {tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] bg-primary text-primary-foreground rounded-full text-[9px] font-bold flex items-center justify-center px-0.5">
                      {tab.badge}
                    </span>
                  )}
                </div>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable tab content only */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
        {activeTab === 'posts' && (
          <PostGrid posts={posts} isLoading={postsLoading} userEmail={user?.email} />
        )}
        {activeTab === 'requests' && (
          pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center px-6">
              <Bell size={32} className="text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No pending follow requests</p>
            </div>
          ) : (
            <FollowRequests currentUser={user} />
          )
        )}
        {activeTab === 'settings' && (
          <ProfileSettings user={user} profile={profile} setProfile={setProfile} />
        )}
      </div>
    </div>
  );
}