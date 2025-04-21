"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Layout from "@/components/Layout";
import ThreadList from "@/components/forum/ThreadList";
import { getForumCategoryBySlug } from '@/lib/supabase/forum';
import { ForumCategory } from '@/lib/types';
import Link from 'next/link';

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategory() {
      try {
        const category = await getForumCategoryBySlug(slug);
        if (!category) {
          setError('Category not found');
          return;
        }
        setCategory(category);
      } catch (err) {
        console.error('Error loading category:', err);
        setError('Failed to load category');
      } finally {
        setLoading(false);
      }
    }

    loadCategory();
  }, [slug]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-6">
          <Link 
            href="/forum" 
            className="text-primary hover:text-primary-dark transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Forum
          </Link>
        </div>
        
        {loading ? (
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
            <p className="mt-4 text-neutral-500 dark:text-neutral-400">Loading category...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Link 
              href="/forum" 
              className="mt-2 inline-block text-sm text-primary hover:text-primary-dark transition-colors"
            >
              Back to Forum
            </Link>
          </div>
        ) : category ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-primary-dark">{category.name}</h1>
                <p className="text-neutral-700 dark:text-neutral-300 mt-2">{category.description}</p>
              </div>
              
              {category.is_premium && (
                <div className="px-3 py-1 bg-accent/20 text-accent-dark text-sm font-medium rounded-full">
                  Premium
                </div>
              )}
            </div>
            
            <ThreadList categoryId={category.id} categorySlug={slug} />
          </>
        ) : null}
      </div>
    </Layout>
  );
}
