export default function PostGrid({ posts, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
        <p className="text-4xl">📸</p>
        <p className="text-muted-foreground text-sm">No posts yet. Complete a workout and share your progress!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5 px-0.5">
      {posts.map((post) => (
        <div key={post.id} className="aspect-square bg-muted overflow-hidden">
          {post.image_url ? (
            <img src={post.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center bg-secondary">
              {post.caption || '📝'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}