# Payment System Quick Start

## 🚀 Get Running in 30 Seconds

### 1. Start the app
```bash
cd /vercel/share/v0-project
pnpm dev
```

### 2. Sign in
- Go to http://localhost:3000
- Sign in with any account

### 3. Test upgrade
- Click **Upgrade** button in Navbar
- Use card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/25`)
- CVC: Any 3 digits (e.g., `123`)
- Click **Subscribe**

### 4. See confirmation
- Success page shows your subscription
- Subscription ID displayed
- You're upgraded! 🎉

---

## 💳 Test Cards

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | ✓ Success |
| `4000 0000 0000 0002` | ✗ Declined |
| `4000 0025 0000 3155` | 🔐 3D Secure required |
| `4000 0000 0000 9995` | ❌ Insufficient funds |

**All fields**: Any future date + any 3-digit CVC

---

## 📁 Important Files

| File | What It Does |
|------|-------------|
| `lib/products.ts` | Product catalog + prices |
| `app/actions/stripe.ts` | Server-side payment logic |
| `components/upgrade/UpgradeCheckout.tsx` | Checkout form |
| `app/upgrade/page.tsx` | Upgrade page |
| `app/upgrade/success/page.tsx` | Success confirmation |

---

## 🎯 Key Features

✓ Sandbox mode (test without real charges)
✓ $199/month recurring subscription
✓ Up to 20 students per team
✓ EmbeddedCheckout (in-app payment form)
✓ Email pre-filled with account email
✓ Server-side price validation
✓ Success/error handling

---

## ⚠️ Common Issues

**Checkout not loading?**
- Restart dev server
- Check env vars: `echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Payment declined?**
- Make sure card is in the test cards table
- Try `4242 4242 4242 4242` first

**Can't access `/upgrade`?**
- You must be signed in first
- If redirected to login, create an account

---

## 📚 Full Guide

See `docs/STRIPE_SANDBOX_GUIDE.md` for complete documentation.

---

## 🔄 Env Vars

Currently configured in `/vercel/share/.env.project`:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

These load automatically when dev server starts.

---

## 🎓 Learn More

- https://stripe.com/docs/testing — Official test cards
- https://stripe.com/docs/checkout/embedded — Embedded checkout docs
- https://stripe.com/docs/keys#test-live-modes — Sandbox vs Live mode
