# FORGE Documentation

Complete documentation for FORGE's features and systems.

## Payment System Documentation

### Quick Links

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **[PAYMENT_QUICK_START.md](./PAYMENT_QUICK_START.md)** | Get running in 30 seconds | 3 min |
| **[STRIPE_SANDBOX_GUIDE.md](./STRIPE_SANDBOX_GUIDE.md)** | Complete payment testing guide | 15 min |
| **[PAYMENT_FLOW.md](./PAYMENT_FLOW.md)** | Technical diagrams and flows | 10 min |
| **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** | 11-point testing checklist | 5 min |
| **[PAYMENT_IMPLEMENTATION.md](./PAYMENT_IMPLEMENTATION.md)** | Implementation summary | 8 min |

---

## Where to Start?

### I want to... 

**Test the payment system immediately**
→ Start with [PAYMENT_QUICK_START.md](./PAYMENT_QUICK_START.md)

**Understand how payments work**
→ Read [STRIPE_SANDBOX_GUIDE.md](./STRIPE_SANDBOX_GUIDE.md)

**See the technical architecture**
→ Check [PAYMENT_FLOW.md](./PAYMENT_FLOW.md)

**Run through all test scenarios**
→ Use [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)

**Get a high-level overview**
→ Review [PAYMENT_IMPLEMENTATION.md](./PAYMENT_IMPLEMENTATION.md)

---

## Payment System Overview

FORGE uses **Stripe** for secure, recurring subscription payments.

### Key Facts

- **Plan**: FORGE Team Plan - $199/month
- **Features**: 20 students, AI archetypes, class management
- **Mode**: Sandbox (test mode, no real charges)
- **Checkout**: EmbeddedCheckout (in-app form)
- **Entry Points**: Navbar, Settings page, dedicated /upgrade page

### Test Card

```
Card: 4242 4242 4242 4242
Date: Any future (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
Result: ✓ Successful payment
```

---

## File Structure

```
docs/
├── README.md                        ← You are here
├── PAYMENT_QUICK_START.md          ← Start here (30 sec overview)
├── STRIPE_SANDBOX_GUIDE.md         ← Complete guide
├── PAYMENT_FLOW.md                 ← Technical architecture
├── TESTING_CHECKLIST.md            ← QA testing (11 scenarios)
└── PAYMENT_IMPLEMENTATION.md       ← Implementation details
```

---

## Quick Start (30 Seconds)

```bash
# 1. Start dev server
pnpm dev

# 2. Open app
open http://localhost:3000

# 3. Click "Upgrade" button

# 4. Use test card: 4242 4242 4242 4242

# 5. Any future date + any CVC

# 6. Click "Subscribe" → Success! ✓
```

---

## Stripe Sandbox Credentials

**Already configured** in `/vercel/share/.env.project`:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

**Products**:
- Product ID: `prod_Uht9VNyr0sK59W`
- Price ID: `price_1TiTNl8vIBNvenfgVpyrM5of`

**View in Dashboard**: https://dashboard.stripe.com/ (Test mode)

---

## Key Files in the App

| File | What It Does |
|------|-------------|
| `lib/stripe.ts` | Server-only Stripe client |
| `lib/products.ts` | Plan catalog ($199 Team Plan) |
| `app/actions/stripe.ts` | Checkout + confirmation logic |
| `components/upgrade/UpgradeCheckout.tsx` | Payment form |
| `app/upgrade/page.tsx` | Upgrade page |
| `app/upgrade/success/page.tsx` | Success confirmation |

---

## Testing Scenarios

### ✓ Successful Payment
Use card `4242 4242 4242 4242` → Payment succeeds

### ✗ Declined Payment
Use card `4000 0000 0000 0002` → Card rejected

### 🔐 3D Secure
Use card `4000 0025 0000 3155` → Authentication required

### ❌ Insufficient Funds
Use card `4000 0000 0000 9995` → Declined

See [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) for full test plan.

---

## Documentation Statistics

| Document | Lines | Focus |
|----------|-------|-------|
| PAYMENT_QUICK_START.md | 105 | Quick reference |
| STRIPE_SANDBOX_GUIDE.md | 298 | Complete guide |
| PAYMENT_FLOW.md | 348 | Technical details |
| TESTING_CHECKLIST.md | 320 | QA testing |
| PAYMENT_IMPLEMENTATION.md | 323 | Implementation |

**Total**: 1,394 lines of documentation

---

## Common Tasks

### I want to test a payment
1. Start dev server: `pnpm dev`
2. Navigate to `/upgrade`
3. Use test card from table above
4. Complete checkout
5. See confirmation page

### I want to monitor payments
1. Go to https://dashboard.stripe.com/
2. Make sure "Test mode" is on (toggle top right)
3. View customers, subscriptions, payments

### I want to go live
1. Get live Stripe keys
2. Update env vars in Vercel
3. Create live product/price on Stripe
4. Update `lib/products.ts` with new price ID
5. Deploy to production

### I want to understand the flow
1. Read [PAYMENT_FLOW.md](./PAYMENT_FLOW.md)
2. See diagrams showing user journey
3. See API flow breakdown
4. See security highlights

---

## Support & Resources

**Official Stripe Docs**: https://stripe.com/docs
**Testing Guide**: https://stripe.com/docs/testing
**Embedded Checkout**: https://stripe.com/docs/checkout/embedded
**API Reference**: https://stripe.com/docs/api

**Internal Docs**:
- Quick start: [PAYMENT_QUICK_START.md](./PAYMENT_QUICK_START.md)
- Full guide: [STRIPE_SANDBOX_GUIDE.md](./STRIPE_SANDBOX_GUIDE.md)
- Architecture: [PAYMENT_FLOW.md](./PAYMENT_FLOW.md)
- Testing: [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)

---

## Next Steps

1. **Read [PAYMENT_QUICK_START.md](./PAYMENT_QUICK_START.md)** (3 min)
2. **Start dev server** and test with sandbox card
3. **Review [PAYMENT_FLOW.md](./PAYMENT_FLOW.md)** to understand architecture
4. **Run [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** to verify all scenarios
5. **When ready**: Deploy to production with live Stripe keys

---

## Questions?

Check the relevant documentation:
- **"How do I test payments?"** → PAYMENT_QUICK_START.md
- **"How does the checkout work?"** → PAYMENT_FLOW.md
- **"What test scenarios exist?"** → TESTING_CHECKLIST.md
- **"How do I deploy to production?"** → STRIPE_SANDBOX_GUIDE.md (bottom section)
- **"What files were created?"** → PAYMENT_IMPLEMENTATION.md

---

Last updated: June 19, 2026
