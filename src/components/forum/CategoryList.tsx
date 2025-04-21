"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getForumCategories } from '@/lib/supabase/forum';
import { ForumCategory } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

export default function CategoryList() {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function loadCategories() {
      try {
        const categories = await getForumCategories();
        setCategories(categories);
      } catch (err) {
        setError('Failed to load forum categories');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    async function checkUserSubscription() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('subscription_tier')
            .eq('id', session.user.id)
            .single();
            
          if (error) throw error;
          setUserSubscription(data?.subscription_tier || 'free');
        }
      } catch (err) {
        console.error('Error checking user subscription:', err);
        setUserSubscription('free'); // Default to free if there's an error
      }
    }

    loadCategories();
    checkUserSubscription();
  }, []);

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
        <p className="mt-4 text-neutral-500 dark:text-neutral-400">Loading categories...</p>
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
    <div className="space-y-6">
      {categories.map((category) => (
        <div 
          key={category.id} 
          className={`p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md hover:shadow-lg transition-shadow ${category.is_premium ? 'border-l-4 border-accent' : ''}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-primary-dark mb-2">
                <Link href={`/forum/${category.slug}`} className="hover:text-primary transition-colors">
                  {category.name}
                </Link>
              </h3>
              <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                {category.description}
              </p>
            </div>
            {category.is_premium && (
              <div className="px-3 py-1 bg-accent/20 text-accent-dark text-sm font-medium rounded-full">
                Premium
              </div>
            )}
          </div>
          
          {category.is_premium && userSubscription === 'free' ? (
            <div className="mt-4 p-3 bg-neutral-100 dark:bg-neutral-700 rounded-md">
              <p className="text-sm text-neutral-600 dark:text-neutral-300 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Upgrade to access premium forum categories. <Link href="/pricing" className="text-primary hover:text-primary-dark font-medium">View plans</Link></span>
              </p>
            </div>
          ) : (
            <Link 
              href={`/forum/${category.slug}`}
              className="inline-block mt-2 text-primary hover:text-primary-dark font-medium transition-colors"
            >
              View discussions →
            </Link>
          )}
        </div>
      ))}
      
      {categories.length === 0 && (
        <div className="p-6 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-center">
          <p className="text-neutral-600 dark:text-neutral-300">No categories found. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
