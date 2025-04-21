import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase/server';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
});

// Initialize Supabase
const supabase = createServerClient();

// This is your Stripe webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;

  try {
    if (!sig || !endpointSecret) {
      return NextResponse.json(
        { error: 'Missing signature or endpoint secret' },
        { status: 400 }
      );
    }

    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionCompleted(checkoutSession);
      break;
    case 'customer.subscription.updated':
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(deletedSubscription);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const userId = session.client_reference_id;
    const tier = session.metadata?.tier || 'free';

    if (!userId) {
      console.error('No userId found in session metadata');
      return;
    }

    // Update user subscription tier
    const { error } = await supabase
      .from('user_profiles')
      .update({ subscription_tier: tier })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user subscription tier:', error);
    }

    // Store subscription info in Supabase
    if (session.subscription) {
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          stripe_subscription_id: session.subscription as string,
          stripe_customer_id: session.customer as string,
          tier,
          status: 'active',
          created_at: new Date().toISOString(),
        });

      if (subscriptionError) {
        console.error('Error storing subscription info:', subscriptionError);
      }
    }
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    // Get customer ID
    const customerId = subscription.customer as string;

    // Find user with this customer ID
    const { data: userData, error: userError } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (userError || !userData) {
      console.error('Error finding user with customer ID:', userError);
      return;
    }

    // Update subscription status
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: subscription.status,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating subscription status:', error);
    }

    // If subscription is not active, downgrade to free tier
    if (subscription.status !== 'active') {
      const { error: tierError } = await supabase
        .from('user_profiles')
        .update({ subscription_tier: 'free' })
        .eq('id', userData.user_id);

      if (tierError) {
        console.error('Error downgrading user tier:', tierError);
      }
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    // Get customer ID
    const customerId = subscription.customer as string;

    // Find user with this customer ID
    const { data: userData, error: userError } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (userError || !userData) {
      console.error('Error finding user with customer ID:', userError);
      return;
    }

    // Update subscription status
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating subscription status:', error);
    }

    // Downgrade to free tier
    const { error: tierError } = await supabase
      .from('user_profiles')
      .update({ subscription_tier: 'free' })
      .eq('id', userData.user_id);

    if (tierError) {
      console.error('Error downgrading user tier:', tierError);
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}
