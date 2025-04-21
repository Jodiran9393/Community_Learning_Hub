import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/client';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
});

// Initialize Supabase
const supabase = createClient();

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId } = await request.json();

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get user information
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get price information from Supabase
    const { data: priceData, error: priceError } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('stripe_price_id', priceId)
      .single();

    if (priceError || !priceData) {
      return NextResponse.json(
        { error: 'Price not found' },
        { status: 404 }
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
      customer_email: userData.email,
      client_reference_id: userId,
      metadata: {
        userId,
        tier: priceData.name.toLowerCase(),
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
