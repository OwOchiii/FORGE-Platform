'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCheckoutSession } from '@/app/actions/stripe';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    getCheckoutSession(sessionId)
      .then(({ status, customerEmail }) => {
        if (status === 'complete') {
          setEmail(customerEmail);
          setStatus('complete');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        <p className="text-gray-500 dark:text-gray-400">Confirming your subscription...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium">
          Something went wrong confirming your payment. Please contact support.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to the Team Plan!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-sm">
          Your subscription is confirmed{email ? ` for ${email}` : ''}. You now have full access to all Team Plan features.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
          <Link href="/dashboard">
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="dark:border-slate-600 dark:text-gray-300">
          <Link href="/courses">Browse Courses</Link>
        </Button>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        A receipt has been sent to your email. You can manage your subscription in Settings.
      </p>
    </div>
  );
}

export default function UpgradeSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-8 sm:p-12 w-full max-w-lg">
        <Suspense fallback={
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        }>
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  );
}
