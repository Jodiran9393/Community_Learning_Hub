import { createClient } from '@/lib/supabase/client';
import { loadStripe } from '@stripe/stripe-js';

// Initialize the Supabase client
const supabase = createClient();

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Get subscription tiers
export async function getSubscriptionTiers() {
  try {
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .order('price', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching subscription tiers:', error);
    return [];
  }
}

// Get user's current subscription
export async function getUserSubscription(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data.subscription_tier;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return 'free';
  }
}

// Create a checkout session for subscription
export async function createCheckoutSession(priceId: string, userId: string) {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId,
      }),
    });

    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Redirect to Stripe checkout
export async function redirectToCheckout(sessionId: string) {
  try {
    const stripe = await stripePromise;
    if (!stripe) throw new Error('Failed to load Stripe');

    const { error } = await stripe.redirectToCheckout({
      sessionId,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    throw error;
  }
}

// Update user subscription tier
export async function updateUserSubscription(userId: string, tier: 'free' | 'basic' | 'premium') {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ subscription_tier: tier })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating user subscription:', error);
    return false;
  }
}

// Cancel subscription
export async function cancelSubscription(userId: string) {
  try {
    const response = await fetch('/api/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
      }),
    });

    const result = await response.json();
    if (result.error) throw new Error(result.error);

    // Update user subscription to free tier
    await updateUserSubscription(userId, 'free');

    return true;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return false;
  }
}
