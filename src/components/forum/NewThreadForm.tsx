"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createThread, getForumCategoryBySlug, userHasPremiumAccess } from '@/lib/supabase/forum';
import { createClient } from '@/lib/supabase/client';

interface NewThreadFormProps {
  categorySlug: string;
}

export default function NewThreadForm({ categorySlug }: NewThreadFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isPremiumCategory, setIsPremiumCategory] = useState(false);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function initialize() {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setError('You must be logged in to create a thread');
          return;
        }
        
        setCurrentUser({ id: session.user.id });
        
        // Get category
        const category = await getForumCategoryBySlug(categorySlug);
        if (!category) {
          setError('Category not found');
          return;
        }
        
        setCategoryId(category.id);
        setIsPremiumCategory(category.is_premium);
        
        // Check if user has premium access if needed
        if (category.is_premium) {
          const hasPremium = await userHasPremiumAccess(session.user.id);
          setHasPremiumAccess(hasPremium);
          
          if (!hasPremium) {
            setError('This category requires a premium subscription');
          }
        }
      } catch (err) {
        console.error('Error initializing new thread form:', err);
        setError('Failed to load category information');
      }
    }

    initialize();
  }, [categorySlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!currentUser || !categoryId) {
      return;
    }
    
    if (isPremiumCategory && !hasPremiumAccess) {
      return;
    }
    
    if (!title.trim() || !content.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const newThread = await createThread({
        title: title.trim(),
        content: content.trim(),
        user_id: currentUser.id,
        category_id: categoryId,
        is_pinned: false,
        is_locked: false
      });
      
      if (newThread) {
        router.push(`/forum/${categorySlug}/${newThread.id}`);
      } else {
        throw new Error('Failed to create thread');
      }
    } catch (err) {
      console.error('Error creating thread:', err);
      setError('Failed to create thread. Please try again.');
      setIsSubmitting(false);
    }
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        {error === 'You must be logged in to create a thread' ? (
          <a 
            href="/" 
            className="mt-2 inline-block text-sm text-primary hover:text-primary-dark transition-colors"
          >
            Sign in
          </a>
        ) : error === 'This category requires a premium subscription' ? (
          <a 
            href="/pricing" 
            className="mt-2 inline-block text-sm text-primary hover:text-primary-dark transition-colors"
          >
            View subscription plans
          </a>
        ) : (
          <button 
            onClick={() => router.push(`/forum/${categorySlug}`)} 
            className="mt-2 text-sm text-primary hover:text-primary-dark transition-colors"
          >
            Back to category
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-primary-dark mb-6">Create New Thread</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-800 dark:text-white"
            placeholder="Enter a descriptive title"
            required
            maxLength={100}
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="content" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-3 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-800 dark:text-white"
            rows={10}
            placeholder="Write your thread content here..."
            required
          />
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            You can use plain text formatting. Line breaks will be preserved.
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push(`/forum/${categorySlug}`)}
            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Thread'}
          </button>
        </div>
      </form>
    </div>
  );
}
