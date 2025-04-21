"use client";

import { createClient } from '@/lib/supabase/client';
import { ForumCategory, ForumThread, ForumPost, UserProfile } from '@/lib/types';

// Initialize the Supabase client
const supabase = createClient();

// Forum Categories
export async function getForumCategories(): Promise<ForumCategory[]> {
  try {
    const { data, error } = await supabase
      .from('forum_categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as ForumCategory[];
  } catch (error) {
    console.error('Error fetching forum categories:', error);
    return [];
  }
}

export async function getForumCategoryBySlug(slug: string): Promise<ForumCategory | null> {
  try {
    const { data, error } = await supabase
      .from('forum_categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data as ForumCategory;
  } catch (error) {
    console.error(`Error fetching forum category with slug ${slug}:`, error);
    return null;
  }
}

// Forum Threads
export async function getThreadsByCategory(categoryId: string): Promise<ForumThread[]> {
  try {
    const { data, error } = await supabase
      .from('forum_threads')
      .select('*')
      .eq('category_id', categoryId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ForumThread[];
  } catch (error) {
    console.error(`Error fetching threads for category ${categoryId}:`, error);
    return [];
  }
}

export async function getThreadById(threadId: string): Promise<ForumThread | null> {
  try {
    const { data, error } = await supabase
      .from('forum_threads')
      .select('*')
      .eq('id', threadId)
      .single();

    if (error) throw error;
    
    // Increment view count
    await supabase
      .from('forum_threads')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', threadId);
      
    return data as ForumThread;
  } catch (error) {
    console.error(`Error fetching thread ${threadId}:`, error);
    return null;
  }
}

export async function createThread(thread: Omit<ForumThread, 'id' | 'created_at' | 'updated_at' | 'view_count'>): Promise<ForumThread | null> {
  try {
    const { data, error } = await supabase
      .from('forum_threads')
      .insert({
        ...thread,
        view_count: 0,
        is_pinned: false,
        is_locked: false
      })
      .select()
      .single();

    if (error) throw error;
    return data as ForumThread;
  } catch (error) {
    console.error('Error creating thread:', error);
    return null;
  }
}

// Forum Posts
export async function getPostsByThread(threadId: string): Promise<ForumPost[]> {
  try {
    const { data, error } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as ForumPost[];
  } catch (error) {
    console.error(`Error fetching posts for thread ${threadId}:`, error);
    return [];
  }
}

export async function createPost(post: Omit<ForumPost, 'id' | 'created_at' | 'updated_at' | 'is_solution'>): Promise<ForumPost | null> {
  try {
    const { data, error } = await supabase
      .from('forum_posts')
      .insert({
        ...post,
        is_solution: false
      })
      .select()
      .single();

    if (error) throw error;
    
    // Update user's post count
    await supabase.rpc('increment_user_post_count', { user_id: post.user_id });
    
    return data as ForumPost;
  } catch (error) {
    console.error('Error creating post:', error);
    return null;
  }
}

// User Profiles
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as UserProfile;
  } catch (error) {
    console.error(`Error fetching user profile for ${userId}:`, error);
    return null;
  }
}

// Real-time subscriptions
export function subscribeToThreadPosts(threadId: string, callback: (post: ForumPost) => void) {
  return supabase
    .channel(`thread-${threadId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'forum_posts',
      filter: `thread_id=eq.${threadId}`
    }, (payload) => {
      callback(payload.new as ForumPost);
    })
    .subscribe();
}

// Check if user has premium access
export async function userHasPremiumAccess(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data.subscription_tier === 'premium' || data.subscription_tier === 'basic';
  } catch (error) {
    console.error(`Error checking premium access for user ${userId}:`, error);
    return false;
  }
}
