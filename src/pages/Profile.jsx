import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Grid3X3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import PostGrid from '@/components/profile/PostGrid';
import ProfileSettings from '@/components/profile/ProfileSettings';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    const loadData = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const profiles = await base44.entities.Profile.filter({ user_id: me.email });
        if (profiles.length) {
          setProfile(profiles[0]);
        } else {
          setProfile({ user_id: me.email, display_name: me.full_name || '', avatar_url: '', is_private: false });
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['myPosts', user?.email],
    queryFn: () => base44.entities.Post.filter({ user_id: user.email }, '-created_date', 50),
    enabled: !!user,
  });

  const tabs = [
    { id: 'posts', label: 'Posts', icon: Grid3X3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="overflow-y-auto h-full" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
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
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'posts' && (
        <PostGrid posts={posts} isLoading={postsLoading} userEmail={user?.email} />
      )}
      {activeTab === 'settings' && (
        <ProfileSettings user={user} profile={profile} setProfile={setProfile} />
      )}
    </div>
  );
}