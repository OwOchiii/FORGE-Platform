'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { UpgradeCheckout } from '@/components/upgrade/UpgradeCheckout';
import { Button } from '@/components/ui/button';
import { Check, ArrowLeft, Zap, Users, BarChart3, Shield } from 'lucide-react';
import Link from 'next/link';
import { PLANS } from '@/lib/products';

const PLAN_HIGHLIGHTS = [
  { icon: Zap, label: 'AI Customer Archetypes', description: 'Instantly generate realistic customer personas from your product data.' },
  { icon: Users, label: 'Up to 20 Students', description: 'Invite your full sales team and track everyone\'s progress.' },
  { icon: BarChart3, label: 'Performance Dashboard', description: 'See scores, trends, and improvement areas at a glance.' },
  { icon: Shield, label: 'Fact-Checking', description: 'AI validates sales claims against your uploaded documentation.' },
];

export default function UpgradePage() {
  const [showCheckout, setShowCheckout] = useState(false);
  const plan = PLANS[0]; // Team plan

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Navbar />

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Back link */}
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Link>

          {!showCheckout ? (
            /* Plan overview */
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Left: plan details */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-5">
                  Most Popular
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 text-balance">
                  Upgrade to the Team Plan
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Turn your product knowledge into a real-world training environment powered by AI. Your team will practice against realistic customer simulations — every day.
                </p>

                <div className="flex items-end gap-1 mb-8">
                  <span className="text-5xl font-extrabold text-gray-900 dark:text-white">$199</span>
                  <span className="text-gray-500 dark:text-gray-400 mb-1.5 text-lg">/ month</span>
                </div>

                {/* Feature highlights */}
                <div className="space-y-4 mb-8">
                  {PLAN_HIGHLIGHTS.map(({ icon: Icon, label, description }) => (
                    <div key={label} className="flex gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Full feature list */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Everything included</p>
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                        <Check className="w-4 h-4 text-orange-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right: CTA card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-orange-500 dark:border-orange-500 shadow-xl p-8 flex flex-col gap-6 lg:sticky lg:top-24">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">You are upgrading to</p>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">FORGE Team Plan</h2>
                </div>

                <div className="border-t border-gray-100 dark:border-slate-700 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Team Plan (monthly)</span>
                    <span className="font-semibold text-gray-900 dark:text-white">$199.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Billing cycle</span>
                    <span className="text-gray-700 dark:text-gray-300">Monthly</span>
                  </div>
                </div>

                <Button
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-md shadow-orange-500/20 transition-transform hover:scale-[1.02]"
                  onClick={() => setShowCheckout(true)}
                >
                  Continue to Payment
                </Button>

                <p className="text-xs text-center text-gray-400 dark:text-gray-500 leading-relaxed">
                  Secured by Stripe. Cancel anytime from your settings. Test card: 4242 4242 4242 4242.
                </p>
              </div>
            </div>
          ) : (
            /* Stripe Embedded Checkout */
            <div>
              <Button
                variant="ghost"
                size="sm"
                className="mb-6 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white gap-1.5"
                onClick={() => setShowCheckout(false)}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to plan details
              </Button>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                  <p className="font-semibold text-gray-900 dark:text-white">Complete your purchase</p>
                  <span className="text-sm text-gray-500 dark:text-gray-400">FORGE Team Plan — $199/mo</span>
                </div>
                <div className="p-4 sm:p-6">
                  <UpgradeCheckout planId="team" />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
