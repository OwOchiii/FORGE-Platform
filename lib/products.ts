export interface Plan {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  stripePriceId: string;
  features: string[];
}

// Source of truth for all upgrade plans.
// Prices are validated server-side — never trust client-supplied amounts.
export const PLANS: Plan[] = [
  {
    id: 'team',
    name: 'Team Plan',
    description: 'Build your sales training system. Up to 20 students.',
    priceInCents: 19900, // $199.00/month
    stripePriceId: 'price_1TiTNl8vIBNvenfgVpyrM5of',
    features: [
      'Create and manage classes',
      'Upload product documentation',
      'AI generates customer archetypes',
      'Edit and approve archetypes',
      'Student dashboard',
      'Fact-checking after simulations',
      'Up to 20 students',
    ],
  },
];

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}
