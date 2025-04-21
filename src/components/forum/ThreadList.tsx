"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getThreadsByCategory, getUserProfile } from '@/lib/supabase/forum';
import { ForumThread, UserProfile } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface ThreadListProps {
  categoryId: string;
  categorySlug: string;
}

export default function ThreadList({ categoryId, categorySlug }: ThreadListProps) {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [users, setUsers] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadThreads() {
      try {
        const threads = await getThreadsByCategory(categoryId);
        setThreads(threads);
        
        // Load user profiles for thread authors
        const userIds = [...new Set(threads.map(thread => thread.user_id))];
        const userProfiles: Record<string, UserProfile> = {};
        
        for (const userId of userIds) {
          const profile = await getUserProfile(userId);
          if (profile) {
            userProfiles[userId] = profile;
          }
        }
        
        setUsers(userProfiles);
      } catch (err) {
        setError('Failed to load threads');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadThreads();
  }, [categoryId]);

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
        <p className="mt-4 text-neutral-500 dark:text-neutral-400">Loading threads...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-sm text-primary hover:text-primary-dark transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => {
        const author = users[thread.user_id];
        
        return (
          <div 
            key={thread.id} 
            className={`p-4 bg-white dark:bg-neutral-800 rounded-lg shadow-sm hover:shadow transition-shadow ${thread.is_pinned ? 'border-l-4 border-primary' : ''}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-primary-dark">
                  <Link href={`/forum/${categorySlug}/${thread.id}`} className="hover:text-primary transition-colors">
                    {thread.is_pinned && (
                      <span className="mr-2 text-primary" title="Pinned thread">
                        📌
                      </span>
                    )}
                    {thread.title}
                  </Link>
                </h3>
                <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Posted by {author ? author.display_name : 'Unknown user'} • {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                </div>
              </div>
              <div className="flex items-center space-x-3 text-sm text-neutral-500 dark:text-neutral-400">
                <div title="View count">
                  <span className="mr-1">👁️</span> {thread.view_count}
                </div>
                {thread.is_locked && (
                  <div className="text-amber-500" title="Thread locked">
                    🔒
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-3 line-clamp-2 text-neutral-600 dark:text-neutral-300 text-sm">
              {thread.content.substring(0, 150)}{thread.content.length > 150 ? '...' : ''}
            </div>
          </div>
        );
      })}
      
      {threads.length === 0 && (
        <div className="p-6 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-center">
          <p className="text-neutral-600 dark:text-neutral-300">No threads found in this category. Be the first to start a discussion!</p>
          <Link 
            href={`/forum/${categorySlug}/new`}
            className="inline-block mt-4 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
          >
            Create Thread
          </Link>
        </div>
      )}
      
      {threads.length > 0 && (
        <div className="mt-6 text-center">
          <Link 
            href={`/forum/${categorySlug}/new`}
            className="inline-block px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
          >
            Create New Thread
          </Link>
        </div>
      )}
    </div>
  );
}
