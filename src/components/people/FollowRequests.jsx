import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';

export default function FollowRequests({ currentUser }) {
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ['incomingFollowRequests', currentUser?.email],
    queryFn: () => base44.entities.FollowRequest.filter({
      target_id: currentUser.email,
      status: 'pending',
    }),
    enabled: !!currentUser,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers', currentUser?.email],
    queryFn: async () => {
      const res = await base44.functions.invoke('getUsers', {});
      return res.data.users || [];
    },
    enabled: !!currentUser,
    staleTime: 60_000,
  });

  const acceptMutation = useMutation({
    mutationFn: async (request) => {
      await base44.entities.FollowRequest.update(request.id, { status: 'accepted' });
      await base44.entities.Follow.create({
        follower_id: request.requester_id,
        following_id: currentUser.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomingFollowRequests'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (request) => {
      await base44.entities.FollowRequest.update(request.id, { status: 'declined' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomingFollowRequests'] });
    },
  });

  if (requests.length === 0) return null;

  const getRequesterInfo = (email) => {
    const found = allUsers.find((u) => u.email === email);
    return {
      display_name: found?.display_name || email.split('@')[0],
      avatar_url: found?.avatar_url || null,
    };
  };

  return (
    <div className="border-b border-border">
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">
          Follow Requests <span className="text-primary ml-1">{requests.length}</span>
        </p>
      </div>
      <div className="flex flex-col divide-y divide-border">
        {requests.map((req) => {
          const info = getRequesterInfo(req.requester_id);
          return (
            <div key={req.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-heading font-bold overflow-hidden flex-shrink-0">
                {info.avatar_url
                  ? <img src={info.avatar_url} alt="" className="w-full h-full object-cover" />
                  : info.display_name?.[0]?.toUpperCase() || '?'}
              </div>
              <p className="flex-1 text-sm font-medium truncate">{info.display_name}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => acceptMutation.mutate(req)}
                  disabled={acceptMutation.isPending || declineMutation.isPending}
                  className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => declineMutation.mutate(req)}
                  disabled={acceptMutation.isPending || declineMutation.isPending}
                  className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center border border-border"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}