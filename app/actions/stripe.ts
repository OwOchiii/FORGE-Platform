'use server';

import { stripe } from '@/lib/stripe';
import { getPlanById } from '@/lib/products';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function createCheckoutSession(planId: string): Promise<{ clientSecret: string }> {
  const plan = getPlanById(planId);
  if (!plan) {
    throw new Error('Invalid plan selected.');
  }

  // Get origin for redirect URLs
  const headersList = await headers();
  const origin = headersList.get('origin') ?? 'http://localhost:3000';

  // Get authenticated user to pre-fill customer email
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    return_url: `${origin}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    ...(user?.email ? { customer_email: user.email } : {}),
    metadata: {
      planId: plan.id,
      userId: user?.id ?? '',
    },
  });

  if (!session.client_secret) {
    throw new Error('Failed to create checkout session.');
  }

  return { clientSecret: session.client_secret };
}

export async function getCheckoutSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return {
    status: session.status,
    customerEmail: session.customer_details?.email ?? '',
    planId: session.metadata?.planId ?? '',
  };
}
