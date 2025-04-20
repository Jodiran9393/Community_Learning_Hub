import Stripe from 'stripe';

// Initialize Stripe with the secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-03-31.basil', // Use the latest API version
});

// Define subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
};

// Define tier features
export const TIER_FEATURES = {
  [SUBSCRIPTION_TIERS.FREE]: {
    name: 'Free',
    price: 0,
    features: [
      'Access to public blog posts',
      'Limited forum access (read-only)',
      'View upcoming events',
    ],
    stripe_price_id: null,
  },
  [SUBSCRIPTION_TIERS.BASIC]: {
    name: 'Basic',
    price: 9.99,
    features: [
      'Full forum access',
      'Participate in discussions',
      'Access to all blog content',
      'Join virtual events',
      'Member badge',
    ],
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
  },
  [SUBSCRIPTION_TIERS.PREMIUM]: {
    name: 'Premium',
    price: 19.99,
    features: [
      'All Basic tier features',
      'Exclusive workshops',
      'Early access to new content',
      'Premium member badge',
      'Priority support',
      'Download resources',
    ],
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
  },
};

// Create a Stripe Checkout Session
export async function createCheckoutSession({
  priceId,
  userId,
  userEmail,
}: {
  priceId: string;
  userId: string;
  userEmail: string;
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      customer_email: userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
      metadata: {
        userId,
      },
    });

    return { sessionId: session.id };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Get subscription details for a customer
export async function getSubscription(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      expand: ['data.default_payment_method'],
    });

    return subscriptions.data[0];
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}
