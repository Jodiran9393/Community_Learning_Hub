"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getThreadById, getPostsByThread, getUserProfile, createPost, subscribeToThreadPosts } from '@/lib/supabase/forum';
import { ForumThread, ForumPost, UserProfile } from '@/lib/types';
import { formatDistanceToNow, format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

interface ThreadViewProps {
  threadId: string;
  categorySlug: string;
}

export default function ThreadView({ threadId, categorySlug }: ThreadViewProps) {
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [users, setUsers] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadThreadAndPosts() {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser({ id: session.user.id });
        }
        
        // Load thread
        const thread = await getThreadById(threadId);
        if (!thread) {
          setError('Thread not found');
          return;
        }
        setThread(thread);
        
        // Load posts
        const posts = await getPostsByThread(threadId);
        setPosts(posts);
        
        // Load user profiles
        const userIds = [
          thread.user_id,
          ...posts.map(post => post.user_id)
        ];
        const uniqueUserIds = [...new Set(userIds)];
        const userProfiles: Record<string, UserProfile> = {};
        
        for (const userId of uniqueUserIds) {
          const profile = await getUserProfile(userId);
          if (profile) {
            userProfiles[userId] = profile;
          }
        }
        
        setUsers(userProfiles);
      } catch (err) {
        setError('Failed to load thread');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadThreadAndPosts();
    
    // Subscribe to real-time updates for new posts
    const subscription = subscribeToThreadPosts(threadId, (newPost) => {
      setPosts(currentPosts => [...currentPosts, newPost]);
      
      // Load the new post author's profile if we don't have it
      getUserProfile(newPost.user_id).then(profile => {
        if (profile) {
          setUsers(currentUsers => ({
            ...currentUsers,
            [newPost.user_id]: profile
          }));
        }
      });
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [threadId]);

  async function handleSubmitPost(e: React.FormEvent) {
    e.preventDefault();
    
    if (!currentUser) {
      alert('You must be logged in to post');
      return;
    }
    
    if (!newPostContent.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newPost = await createPost({
        content: newPostContent,
        thread_id: threadId,
        user_id: currentUser.id
      });
      
      if (newPost) {
        setNewPostContent('');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mx-auto"></div>
            <div className="space-y-2">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
        <p className="mt-4 text-neutral-500 dark:text-neutral-400">Loading thread...</p>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{error || 'Thread not found'}</p>
        <button 
          onClick={() => router.push(`/forum/${categorySlug}`)} 
          className="mt-2 text-sm text-primary hover:text-primary-dark transition-colors"
        >
          Back to category
        </button>
      </div>
    );
  }

  const threadAuthor = users[thread.user_id];

  return (
    <div className="space-y-6">
      {/* Thread header */}
      <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-primary-dark">
              {thread.is_pinned && (
                <span className="mr-2 text-primary" title="Pinned thread">
                  ud83dudccc
                </span>
              )}
              {thread.title}
            </h1>
            <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 flex items-center">
              <span>Posted by {threadAuthor ? threadAuthor.display_name : 'Unknown user'}</span>
              <span className="mx-2">u2022</span>
              <span title={format(new Date(thread.created_at), 'PPpp')}>
                {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
              </span>
              <span className="mx-2">u2022</span>
              <span>{thread.view_count} views</span>
              {thread.is_locked && (
                <>
                  <span className="mx-2">u2022</span>
                  <span className="text-amber-500" title="Thread locked">
                    ud83dudd12 Locked
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 prose dark:prose-invert max-w-none">
          {thread.content.split('\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </div>
      
      {/* Posts */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-primary-dark">
          Replies ({posts.length})
        </h2>
        
        {posts.length === 0 ? (
          <div className="p-6 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-center">
            <p className="text-neutral-600 dark:text-neutral-300">No replies yet. Be the first to reply!</p>
          </div>
        ) : (
          posts.map((post) => {
            const author = users[post.user_id];
            
            return (
              <div 
                key={post.id} 
                id={`post-${post.id}`}
                className={`p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-sm ${post.is_solution ? 'border-l-4 border-green-500' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {author?.avatar_url ? (
                        <img 
                          src={author.avatar_url} 
                          alt={author.display_name} 
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {author?.display_name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-primary-dark">
                        {author?.display_name || 'Unknown user'}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400" title={format(new Date(post.created_at), 'PPpp')}>
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  
                  {post.is_solution && (
                    <div className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 text-xs font-medium rounded-full">
                      Solution
                    </div>
                  )}
                </div>
                
                <div className="mt-4 prose dark:prose-invert max-w-none">
                  {post.content.split('\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Reply form */}
      {!thread.is_locked ? (
        currentUser ? (
          <form onSubmit={handleSubmitPost} className="mt-8">
            <h3 className="text-lg font-bold text-primary-dark mb-2">Post a reply</h3>
            <div className="mb-4">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="w-full p-3 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-800 dark:text-white"
                rows={5}
                placeholder="Write your reply here..."
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !newPostContent.trim()}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Posting...' : 'Post Reply'}
            </button>
          </form>
        ) : (
          <div className="mt-8 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-center">
            <p className="text-neutral-600 dark:text-neutral-300">
              Please <a href="/" className="text-primary hover:text-primary-dark">sign in</a> to post a reply.
            </p>
          </div>
        )
      ) : (
        <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
          <p className="text-amber-800 dark:text-amber-400">
            This thread has been locked. No new replies can be posted.
          </p>
        </div>
      )}
    </div>
  );
}
