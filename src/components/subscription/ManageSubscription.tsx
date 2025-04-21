"use client";

import { useState, useEffect } from 'react';
import { getUserSubscription, cancelSubscription } from '@/lib/stripe/subscription';
import { createClient } from '@/lib/supabase/client';

export default function ManageSubscription() {
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function loadSubscription() {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser({ id: session.user.id });
          
          // Get user's current subscription
          const subscription = await getUserSubscription(session.user.id);
          setCurrentPlan(subscription);
        } else {
          // Redirect to login if not authenticated
          window.location.href = '/';
        }
      } catch (err) {
        console.error('Error loading subscription:', err);
        setError('Failed to load subscription details');
      } finally {
        setLoading(false);
      }
    }

    loadSubscription();
  }, []);

  async function handleCancelSubscription() {
    if (!currentUser || currentPlan === 'free') {
      return;
    }
    
    // Confirm cancellation
    const confirmed = window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.');
    if (!confirmed) {
      return;
    }
    
    setCancelling(true);
    setError(null);
    setSuccess(null);
    
    try {
      const success = await cancelSubscription(currentUser.id);
      if (success) {
        setCurrentPlan('free');
        setSuccess('Your subscription has been cancelled. You will have access until the end of your current billing period.');
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (err: any) {
      console.error('Error cancelling subscription:', err);
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mx-auto"></div>
          </div>
        </div>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Loading subscription details...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-primary-dark mb-4">Manage Subscription</h3>
      
      {error && (
        <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="p-4 mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}
      
      <div className="mb-6">
        <p className="text-neutral-700 dark:text-neutral-300">
          Current Plan: <span className="font-medium">{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</span>
        </p>
        
        {currentPlan !== 'free' && (
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            You have access to {currentPlan === 'premium' ? 'all premium' : 'basic'} features.
          </p>
        )}
      </div>
      
      {currentPlan !== 'free' ? (
        <div className="space-y-4">
          <button
            onClick={handleCancelSubscription}
            disabled={cancelling}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
          </button>
          
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Cancelling your subscription will downgrade your account to the free tier at the end of your current billing period.
          </p>
        </div>
      ) : (
        <div>
          <p className="text-neutral-700 dark:text-neutral-300">
            You are currently on the free plan. Upgrade to get access to premium features!
          </p>
          
          <a 
            href="/pricing" 
            className="mt-4 inline-block px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
          >
            View Plans
          </a>
        </div>
      )}
    </div>
  );
}
