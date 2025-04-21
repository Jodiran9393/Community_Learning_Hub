"use client";

import { useState, useEffect } from 'react';
import { getSubscriptionTiers, getUserSubscription, createCheckoutSession, redirectToCheckout } from '@/lib/stripe/subscription';
import { createClient } from '@/lib/supabase/client';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  stripe_price_id: string;
}

export default function PricingPlans() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function loadPlans() {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser({ id: session.user.id });
          
          // Get user's current subscription
          const subscription = await getUserSubscription(session.user.id);
          setCurrentPlan(subscription);
        }
        
        // Load subscription tiers
        const tiers = await getSubscriptionTiers();
        setPlans(tiers);
      } catch (err) {
        console.error('Error loading plans:', err);
        setError('Failed to load subscription plans');
      } finally {
        setLoading(false);
      }
    }

    loadPlans();
  }, []);

  async function handleSubscribe(plan: PricingPlan) {
    if (!currentUser) {
      // Redirect to login
      window.location.href = '/';
      return;
    }
    
    // Don't resubscribe to current plan
    if (plan.name.toLowerCase() === currentPlan.toLowerCase()) {
      return;
    }
    
    // Don't process if already subscribing
    if (subscribing) {
      return;
    }
    
    setSubscribing(true);
    setError(null);
    
    try {
      // Create checkout session
      const session = await createCheckoutSession(plan.stripe_price_id, currentUser.id);
      
      // Redirect to Stripe checkout
      await redirectToCheckout(session.sessionId);
    } catch (err: any) {
      console.error('Error subscribing to plan:', err);
      setError(err.message || 'Failed to process subscription');
      setSubscribing(false);
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
        <p className="mt-4 text-neutral-500 dark:text-neutral-400">Loading subscription plans...</p>
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
    <div className="grid md:grid-cols-3 gap-8">
      {plans.map((plan) => {
        const isCurrentPlan = plan.name.toLowerCase() === currentPlan.toLowerCase();
        const isPremiumPlan = plan.name.toLowerCase() === 'premium';
        
        return (
          <div 
            key={plan.id} 
            className={`p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md ${isPremiumPlan ? 'border-2 border-accent' : ''}`}
          >
            <div className="text-center mb-6">
              <h3 className={`text-xl font-bold mb-2 ${isPremiumPlan ? 'text-accent-dark' : 'text-primary-dark'}`}>
                {plan.name}
              </h3>
              <div className="text-3xl font-bold">
                ${plan.price.toFixed(2)}
                <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">/month</span>
              </div>
              <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                {plan.description}
              </p>
            </div>
            
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-neutral-700 dark:text-neutral-300">{feature}</span>
                </li>
              ))}
            </ul>
            
            <div className="text-center">
              {!currentUser ? (
                <a 
                  href="/" 
                  className={`inline-block w-full px-4 py-2 rounded-md transition-colors ${isPremiumPlan ? 'bg-accent hover:bg-accent-dark text-primary-dark font-bold' : 'bg-primary hover:bg-primary-dark text-white'}`}
                >
                  Sign In to Subscribe
                </a>
              ) : isCurrentPlan ? (
                <button 
                  disabled 
                  className="inline-block w-full px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-md cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : (
                <button 
                  onClick={() => handleSubscribe(plan)}
                  disabled={subscribing}
                  className={`inline-block w-full px-4 py-2 rounded-md transition-colors ${isPremiumPlan ? 'bg-accent hover:bg-accent-dark text-primary-dark font-bold' : 'bg-primary hover:bg-primary-dark text-white'} ${subscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {subscribing ? 'Processing...' : `Subscribe to ${plan.name}`}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
