"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ForumThread, ForumPost } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

export default function UserActivity() {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [posts, setPosts] = useState<(ForumPost & { thread_title: string, category_slug: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function loadActivity() {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          return;
        }
        
        // Get user's threads
        const { data: threadData, error: threadError } = await supabase
          .from('forum_threads')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (threadError) throw threadError;
        setThreads(threadData as ForumThread[]);
        
        // Get user's posts (excluding their own threads)
        const { data: postData, error: postError } = await supabase
          .from('forum_posts')
          .select(`
            *,
            forum_threads!inner(title, category_id),
            forum_threads!inner(forum_categories!inner(slug))
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (postError) throw postError;
        
        // Format post data
        const formattedPosts = postData.map(post => ({
          ...post,
          thread_title: post.forum_threads.title,
          category_slug: post.forum_threads.forum_categories.slug
        }));
        
        setPosts(formattedPosts);
      } catch (err) {
        console.error('Error loading activity:', err);
        setError('Failed to load activity');
      } finally {
        setLoading(false);
      }
    }

    loadActivity();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-primary-dark mb-4">Recent Activity</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
          <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
          <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-primary-dark mb-4">Recent Activity</h2>
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  const hasActivity = threads.length > 0 || posts.length > 0;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-primary-dark mb-4">Recent Activity</h2>
      
      {!hasActivity ? (
        <div className="text-center py-4 text-neutral-500 dark:text-neutral-400">
          <p>You haven't created any threads or posts yet.</p>
          <Link 
            href="/forum"
            className="inline-block mt-2 text-primary hover:text-primary-dark transition-colors"
          >
            Join the discussion
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => (
            <div 
              key={thread.id} 
              className="border-b border-neutral-200 dark:border-neutral-700 pb-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-primary">You created a thread</p>
                  <Link 
                    href={`/forum/category/${thread.category_id}/${thread.id}`}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    {thread.title}
                  </Link>
                </div>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
          
          {posts.map((post) => (
            <div 
              key={post.id} 
              className="border-b border-neutral-200 dark:border-neutral-700 pb-4 last:border-0 last:pb-0"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-primary">You replied to</p>
                  <Link 
                    href={`/forum/${post.category_slug}/${post.thread_id}#post-${post.id}`}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    {post.thread_title}
                  </Link>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-1">
                    {post.content}
                  </p>
                </div>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
          
          <div className="text-center pt-2">
            <Link 
              href="/dashboard/activity"
              className="text-primary hover:text-primary-dark transition-colors"
            >
              View all activity
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
