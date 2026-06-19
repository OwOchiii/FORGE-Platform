# FORGE Payment Flow Diagram

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Journey                                │
└─────────────────────────────────────────────────────────────────┘

1. DISCOVERY
   ┌──────────────────────────────────┐
   │  User sees "Upgrade" button      │
   │  - In Navbar (desktop/mobile)    │
   │  - In Settings page              │
   │  - In pricing section (future)   │
   └──────────────────┬───────────────┘
                      │
                      ▼
2. UPGRADE PAGE
   ┌──────────────────────────────────┐
   │  /upgrade                        │
   │  - Plan details displayed        │
   │  - Features listed               │
   │  - Price: $199/month             │
   │  - "Upgrade Now" button          │
   └──────────────────┬───────────────┘
                      │
                      ▼
3. CHECKOUT SESSION CREATED (Server)
   ┌──────────────────────────────────┐
   │  createCheckoutSession() action   │
   │  - Validates price ID            │
   │  - Creates Stripe session        │
   │  - Pre-fills user email          │
   │  - Returns session ID            │
   └──────────────────┬───────────────┘
                      │
                      ▼
4. EMBEDDED CHECKOUT
   ┌──────────────────────────────────┐
   │  Stripe EmbeddedCheckout form    │
   │  - Email (pre-filled)            │
   │  - Card details                  │
   │  - Billing address               │
   │  - "Subscribe" button            │
   └──────────────────┬───────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
    SUCCESS      DECLINED      CANCELLED
        │             │             │
        ▼             ▼             ▼
5a. PAYMENT    5b. ERROR         User
    PROCESSED      SHOWN          Back to
    Stripe         Try again      /upgrade
    creates        with
    subscription   different
    │              card
    ▼
6. REDIRECT
   /upgrade/success
    │
    ▼
7. CONFIRMATION PAGE
   ┌──────────────────────────────────┐
   │  - Subscription confirmed        │
   │  - Subscription ID displayed     │
   │  - Features now unlocked         │
   │  - "Go to Dashboard" button      │
   └──────────────────┬───────────────┘
                      │
                      ▼
8. TEAM PLAN ACTIVE
   ┌──────────────────────────────────┐
   │  Features unlocked:              │
   │  ✓ Create classes               │
   │  ✓ Upload product docs          │
   │  ✓ AI customer archetypes       │
   │  ✓ Up to 20 students            │
   │  ✓ Team management              │
   └──────────────────────────────────┘
```

---

## API Flow (Server-Side)

```
┌────────────────────────────────────────────────────────────┐
│                  Server-Side Payment Flow                 │
└────────────────────────────────────────────────────────────┘

CLIENT REQUESTS CHECKOUT
        │
        ▼
   /api/actions/stripe.ts
   createCheckoutSession()
        │
        ├─ Get user from auth context
        ├─ Validate product price ID
        ├─ Call Stripe API (POST /checkout/sessions)
        │   Payload:
        │   {
        │     line_items: [{
        │       price: "price_1TiTNl8vIBNvenfgVpyrM5of",
        │       quantity: 1
        │     }],
        │     mode: "subscription",
        │     customer_email: user.email,
        │     success_url: baseUrl + "/upgrade/success",
        │     cancel_url: baseUrl + "/upgrade"
        │   }
        │
        ├─ Stripe validates and creates session
        ├─ Return session.clientSecret
        │
        ▼
   CLIENT receives clientSecret
        │
        ▼
   EmbeddedCheckout initializes
   with clientSecret
        │
        ▼
   USER enters payment details
        │
        ▼
   Stripe processes payment
        │
   ┌────┴────┐
   │          │
   ▼          ▼
SUCCESS    FAIL
   │          │
   │          └─ Error shown in form
   │
   ▼
Redirect to /upgrade/success
        │
        ▼
getCheckoutSession()
        │
        ├─ Query Stripe for subscription
        ├─ Return subscription details
        │   {
        │     id: "sub_...",
        │     status: "active",
        │     items: {...},
        │     current_period_end: {...}
        │   }
        │
        ▼
Display confirmation page
```

---

## Code Flow

### 1. User clicks "Upgrade"
```typescript
// components/upgrade/UpgradeCheckout.tsx
onClick={() => handleCheckout('team-plan')}
  ↓
// Calls server action
await createCheckoutSession('price_1TiTNl8vIBNvenfgVpyrM5of')
```

### 2. Server creates session
```typescript
// app/actions/stripe.ts
export async function createCheckoutSession(priceId: string) {
  // 1. Validate user is authenticated
  const { user } = await getAuth()
  
  // 2. Validate price ID against products
  const product = PRODUCTS.find(p => p.priceId === priceId)
  if (!product) throw new Error('Invalid product')
  
  // 3. Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    customer_email: user.email,
    success_url: `${baseUrl}/upgrade/success`,
    cancel_url: `${baseUrl}/upgrade`,
  })
  
  // 4. Return to client
  return { clientSecret: session.client_secret }
}
```

### 3. Client renders checkout
```typescript
// components/upgrade/UpgradeCheckout.tsx
<EmbeddedCheckout
  options={{ clientSecret }}
  stripe={stripePromise}
/>
```

### 4. User completes payment
- Stripe form securely handles card details
- No card data touches FORGE servers

### 5. Success redirect
```typescript
// app/upgrade/success/page.tsx
const { sessionId } = searchParams
const subscription = await getCheckoutSession(sessionId)
// Display confirmation
```

---

## Data Flow: Environment Variables

```
┌──────────────────────────────┐
│  Stripe Dashboard            │
│  - API Keys                  │
│  - Products                  │
│  - Prices                    │
└──────────────────┬───────────┘
                   │
                   ▼
┌──────────────────────────────┐
│  /vercel/share/.env.project  │
│  - NEXT_PUBLIC_STRIPE_...    │
│  - STRIPE_SECRET_KEY         │
└──────────────────┬────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   CLIENT SIDE          SERVER SIDE
   (Public Key)         (Secret Key)
        │                     │
        ▼                     ▼
   Stripe JS        Stripe SDK
   Initialize       Create sessions
   Checkout         Process payments
```

---

## Key Security Points

```
1. PRICE VALIDATION
   ├─ Server validates price against PRODUCTS array
   ├─ Client cannot set custom prices
   └─ Stripe confirms amount before charging

2. AUTHENTICATION
   ├─ User must be authenticated
   ├─ Email from auth context (not form input)
   └─ Session tied to user account

3. SECRET KEY PROTECTION
   ├─ STRIPE_SECRET_KEY never exposed to client
   ├─ All API calls from server-side actions
   └─ Server-only module in lib/stripe.ts

4. PCI COMPLIANCE
   ├─ Card data never touches FORGE servers
   ├─ Stripe handles all payment data
   └─ HTTPS required in production
```

---

## Webhook Events (Future Implementation)

For production, you'll want to listen for Stripe webhooks:

```typescript
// Future: app/api/webhooks/stripe/route.ts

const signature = req.headers.get('stripe-signature')
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
)

switch (event.type) {
  case 'customer.subscription.updated':
    // Update user subscription status
    break
  case 'customer.subscription.deleted':
    // Handle subscription cancellation
    break
  case 'invoice.payment_failed':
    // Send failure notification
    break
}
```

---

## Testing the Flow

### Success Path
```bash
1. Visit /upgrade
2. Click "Upgrade Now"
3. Enter: 4242 4242 4242 4242
4. Any future date + any CVC
5. Click "Subscribe"
6. ✓ Redirected to /upgrade/success
```

### Decline Path
```bash
1. Visit /upgrade
2. Click "Upgrade Now"
3. Enter: 4000 0000 0000 0002
4. Click "Subscribe"
5. ✗ Error: "Your card was declined"
```

### Cancel Path
```bash
1. Visit /upgrade
2. Click "Upgrade Now"
3. Click browser back / close form
4. ✓ Back on /upgrade
```

---

## Monitoring

Check Stripe Dashboard for:
- **Customers**: View all signups with payment attempts
- **Subscriptions**: Active, past due, canceled subscriptions
- **Payments**: All transactions (successes and failures)
- **Disputes**: Handle customer chargebacks
- **Logs**: API call history and errors

Visit: https://dashboard.stripe.com/ → Test mode
