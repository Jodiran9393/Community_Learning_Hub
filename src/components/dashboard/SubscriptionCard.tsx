"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUserSubscription } from '@/lib/stripe/subscription';
import { createClient } from '@/lib/supabase/client';

export default function SubscriptionCard() {
  const [subscription, setSubscription] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function loadSubscription() {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          return;
        }
        
        setUserId(session.user.id);
        
        // Get subscription
        const tier = await getUserSubscription(session.user.id);
        setSubscription(tier);
      } catch (err) {
        console.error('Error loading subscription:', err);
        setError('Failed to load subscription details');
      } finally {
        setLoading(false);
      }
    }

    loadSubscription();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 border-l-4 border-primary">
        <div className="animate-pulse">
          <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-4"></div>
          <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 border-l-4 border-red-500">
        <h2 className="text-xl font-bold text-primary-dark mb-2">Your Subscription</h2>
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Link 
          href="/pricing"
          className="inline-block bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded transition-colors"
        >
          View Plans
        </Link>
      </div>
    );
  }

  // Determine subscription details
  let borderColor = 'border-primary';
  let badgeColor = 'bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200';
  let description = 'Upgrade your plan to unlock additional features and content.';
  let buttonText = 'Upgrade Plan';
  
  if (subscription === 'basic') {
    borderColor = 'border-primary-dark';
    badgeColor = 'bg-primary/20 text-primary-dark';
    description = 'You have access to premium forum categories and events.';
    buttonText = 'Manage Subscription';
  } else if (subscription === 'premium') {
    borderColor = 'border-accent';
    badgeColor = 'bg-accent/20 text-accent-dark';
    description = 'You have full access to all premium features and content.';
    buttonText = 'Manage Subscription';
  }

  return (
    <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 border-l-4 ${borderColor}`}>
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold text-primary-dark">Your Subscription</h2>
        <span className={`px-3 py-1 ${badgeColor} text-sm font-medium rounded-full capitalize`}>
          {subscription} Plan
        </span>
      </div>
      <p className="text-neutral-700 dark:text-neutral-300 mb-4">
        {description}
      </p>
      {subscription === 'free' ? (
        <Link 
          href="/pricing"
          className="inline-block bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded transition-colors"
        >
          {buttonText}
        </Link>
      ) : (
        <Link 
          href="/dashboard/subscription"
          className="inline-block bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded transition-colors"
        >
          {buttonText}
        </Link>
      )}
    </div>
  );
}
