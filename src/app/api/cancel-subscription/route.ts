import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase/server';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
});

// Initialize Supabase
const supabase = createServerClient();
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Get user's subscription info from Supabase
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subscriptionError || !subscriptionData) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Cancel the subscription in Stripe
    await stripe.subscriptions.cancel(subscriptionData.stripe_subscription_id);

    // Update subscription status in Supabase
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionData.id);

    if (updateError) {
      console.error('Error updating subscription status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update subscription status' },
        { status: 500 }
      );
    }

    // Update user's subscription tier to free
    const { error: userError } = await supabase
      .from('user_profiles')
      .update({ subscription_tier: 'free' })
      .eq('id', userId);

    if (userError) {
      console.error('Error updating user subscription tier:', userError);
      return NextResponse.json(
        { error: 'Failed to update user subscription tier' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
