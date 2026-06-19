'use client';

import { useCallback, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import { createCheckoutSession } from '@/app/actions/stripe';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface UpgradeCheckoutProps {
  planId: string;
}

export function UpgradeCheckout({ planId }: UpgradeCheckoutProps) {
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    try {
      const { clientSecret } = await createCheckoutSession(planId);
      return clientSecret;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout.');
      return '';
    }
  }, [planId]);

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-sm text-red-700 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <EmbeddedCheckoutProvider
      stripe={stripePromise}
      options={{ fetchClientSecret }}
    >
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
