# Stripe Sandbox Payment Testing Guide

This guide walks through testing the FORGE payment system using Stripe's sandbox environment.

## Overview

FORGE uses Stripe for secure payment processing. The implementation is currently configured for **sandbox mode**, which allows you to test payments without real charges.

### Sandbox Credentials

- **Product ID**: `prod_Uht9VNyr0sK59W` (FORGE Team Plan)
- **Price ID**: `price_1TiTNl8vIBNvenfgVpyrM5of` ($199/month recurring)
- **Environment**: Stripe sandbox (test mode)
- **Keys**: `pk_test_*` and `sk_test_*` (visible in `/vercel/share/.env.project`)

## Testing the Payment Flow

### Step 1: Access the Upgrade Page

1. Start the dev server:
   ```bash
   cd /vercel/share/v0-project
   pnpm dev
   ```

2. Navigate to http://localhost:3000

3. Sign in with a demo account (or create one)

4. Click the **Upgrade** button in the Navbar or navigate to `/upgrade`

### Step 2: View the Upgrade Plan

The upgrade page displays:
- FORGE Team Plan details
- Features included (AI customer archetypes, class management, up to 20 students, etc.)
- Monthly price: **$199/mo**
- "Upgrade Now" button to proceed to Stripe Checkout

### Step 3: Complete the Stripe Checkout

1. Click "Upgrade Now" button
2. The Stripe EmbeddedCheckout form will appear with:
   - Email field (pre-filled with your account email)
   - Card payment form
   - Billing details section

3. Fill in the payment details using Stripe sandbox test cards (see below)

4. Click "Subscribe" to process the payment

### Step 4: Confirmation Page

After successful payment:
- You'll be redirected to `/upgrade/success`
- The page displays subscription confirmation
- Shows subscription ID from Stripe
- Provides a link back to the dashboard

---

## Stripe Sandbox Test Cards

Use these test card numbers in the Stripe checkout form. All fields can use any future date and any 3-digit CVC.

### Successful Payment

```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
Name: Any name
```

**Result**: ✓ Payment succeeds, subscription created

### Declined Payment

```
Card Number: 4000 0000 0000 0002
Expiry: Any future date
CVC: Any 3 digits
```

**Result**: ✗ Payment is declined (for testing error handling)

### 3D Secure / Authentication Required

```
Card Number: 4000 0025 0000 3155
Expiry: Any future date
CVC: Any 3 digits
```

**Result**: Requires 3D Secure verification (complete the flow to succeed)

### Insufficient Funds

```
Card Number: 4000 0000 0000 9995
Expiry: Any future date
CVC: Any 3 digits
```

**Result**: Card declined due to insufficient funds

---

## File Structure

### Core Payment Files

| File | Purpose |
|------|---------|
| `lib/stripe.ts` | Server-only Stripe client initialization |
| `lib/products.ts` | Product catalog with validated price IDs |
| `app/actions/stripe.ts` | Server actions for checkout session and confirmation |
| `components/upgrade/UpgradeCheckout.tsx` | Stripe EmbeddedCheckout component |
| `app/upgrade/page.tsx` | Upgrade page with plan details and checkout flow |
| `app/upgrade/success/page.tsx` | Confirmation page after successful payment |

### Integration Points

- **Navbar**: Displays "Upgrade" button (orange gradient pill)
- **Settings**: "Upgrade Your Plan" card section
- **Mobile**: Responsive upgrade option in mobile menu

---

## How the Checkout Flow Works

### 1. User initiates upgrade
- Clicks "Upgrade" button in Navbar/Settings
- Navigates to `/upgrade` page

### 2. Server creates checkout session
- `createCheckoutSession()` server action is called with price ID
- Stripe API creates an embedded checkout session
- Session is pre-filled with user's email (from auth context)

### 3. Stripe handles payment
- EmbeddedCheckout renders securely within the app
- User fills card details directly
- Stripe processes the payment

### 4. Success confirmation
- On successful subscription, redirect to `/upgrade/success`
- `getCheckoutSession()` server action fetches subscription details from Stripe
- Success page displays confirmation and next steps

### 5. Error handling
- If checkout is cancelled, user stays on `/upgrade` page
- If payment fails, error message displays in checkout form
- Server-side error handling prevents invalid sessions

---

## Environment Variables

The following Stripe environment variables are **required** and already configured:

```bash
# Stripe API Keys (in /vercel/share/.env.project)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Client-side key
STRIPE_SECRET_KEY=sk_test_...                   # Server-side key (secure)
```

These are sourced automatically by Next.js. The publishable key is safe to expose (client-side), while the secret key is only used server-side.

---

## Testing Scenarios

### Scenario 1: Successful Subscription
1. Navigate to `/upgrade`
2. Use card `4242 4242 4242 4242`
3. Enter any future date and CVC
4. Click "Subscribe"
5. **Expected**: Redirected to `/upgrade/success` with subscription confirmation

### Scenario 2: Declined Payment
1. Navigate to `/upgrade`
2. Use card `4000 0000 0000 0002`
3. Click "Subscribe"
4. **Expected**: Error message "Your card was declined"

### Scenario 3: Cancelled Checkout
1. Navigate to `/upgrade`
2. Click the browser back button or close the form
3. **Expected**: Returned to `/upgrade` page

### Scenario 4: Multiple Subscriptions
1. Complete one successful subscription
2. Navigate back to `/upgrade`
3. Start a new checkout session
4. **Expected**: Each subscription has its own unique session

---

## Viewing Subscriptions in Stripe Dashboard

To see all test subscriptions created:

1. Go to https://dashboard.stripe.com/
2. Login with your Stripe account
3. Ensure you're viewing **Test mode** (toggle in top right)
4. Navigate to **Customers** → View test customers
5. Click a customer to see their subscriptions
6. Click a subscription to view payment history

---

## Transitioning to Live Mode

When ready to accept real payments:

### 1. Get Live Keys
- Go to https://dashboard.stripe.com/apikeys
- Copy your **Live** publishable and secret keys

### 2. Update Environment Variables
Replace test keys with live keys in your Vercel project:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

### 3. Update Product/Price IDs
Create a new product and price in **Live mode** on Stripe dashboard:
```bash
# Live mode IDs (example)
STRIPE_TEAM_PRICE_ID=price_1ABC...xyz  # Live price ID
```

### 4. Update lib/products.ts
Change the price ID in the products array:
```typescript
export const PRODUCTS: Product[] = [
  {
    id: 'team-plan',
    name: 'FORGE Team Plan',
    description: '...',
    priceId: 'price_1ABC...xyz',  // New live price ID
    priceInCents: 19900,
  },
]
```

### 5. Deploy
Push changes to production. Real charges will now be processed.

---

## Troubleshooting

### Checkout not loading
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Check browser console for errors
- Ensure dev server is running on correct port

### Payment declined
- Use a test card that matches your scenario (see test cards table)
- Verify card details match exactly
- Check Stripe dashboard for payment attempt details

### No redirect to success page
- Check `/upgrade/success` page loads manually
- Verify server action `getCheckoutSession()` works
- Check browser console for client-side errors

### Session expired
- If checkout takes too long, session may expire
- Refresh and start a new checkout
- Sessions are valid for 24 hours

### Environment variables not loading
- Restart dev server: `pnpm dev`
- Verify keys are in `/vercel/share/.env.project`
- Use `echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to test

---

## Security Notes

- **Secret keys are never exposed**: All API calls use server-side actions
- **Prices validated server-side**: Client cannot manipulate payment amounts
- **PCI compliance**: Stripe handles card data (we never touch it)
- **HTTPS only in production**: Always use HTTPS for real payments

---

## Reference

- **Stripe Docs**: https://stripe.com/docs
- **Stripe Testing**: https://stripe.com/docs/testing
- **Embedded Checkout**: https://stripe.com/docs/checkout/embedded
- **Sandbox Environment**: https://stripe.com/docs/keys#test-live-modes
