# Stripe Payment System Testing Checklist

## Pre-Flight Checklist

- [ ] Dev server running: `pnpm dev`
- [ ] Can access http://localhost:3000
- [ ] Have a test account (sign up if needed)
- [ ] Logged in to app
- [ ] Environment variables loaded (check: `echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)

---

## Test Case 1: Successful Subscription

**Objective**: Complete a payment and reach success page

**Steps**:
1. [ ] Navigate to `/upgrade`
2. [ ] Verify page displays:
   - [ ] FORGE Team Plan title
   - [ ] Features list (7 items)
   - [ ] Price: $199/mo
   - [ ] "Upgrade Now" button
3. [ ] Click "Upgrade Now"
4. [ ] Stripe checkout form appears:
   - [ ] Email pre-filled with account email
   - [ ] Card input field visible
   - [ ] Billing details section
5. [ ] Enter test card `4242 4242 4242 4242`
6. [ ] Enter any future date (e.g., `12/25`)
7. [ ] Enter any 3-digit CVC (e.g., `123`)
8. [ ] Click "Subscribe"
9. [ ] Verify redirect to `/upgrade/success`
10. [ ] Verify success page shows:
    - [ ] "Subscription Confirmed" heading
    - [ ] Subscription ID (starts with `sub_`)
    - [ ] Plan details
    - [ ] "Go to Dashboard" button

**Expected Result**: ✓ Full flow completes without errors

---

## Test Case 2: Declined Payment

**Objective**: Handle payment decline gracefully

**Steps**:
1. [ ] Navigate to `/upgrade`
2. [ ] Click "Upgrade Now"
3. [ ] Enter test card `4000 0000 0000 0002`
4. [ ] Enter any future date
5. [ ] Enter any CVC
6. [ ] Click "Subscribe"
7. [ ] Verify error message appears:
   - [ ] Error is displayed in the checkout form
   - [ ] Message indicates card was declined
   - [ ] User stays on checkout form
8. [ ] Try again with success card `4242 4242 4242 4242`
9. [ ] Verify payment now succeeds

**Expected Result**: ✓ Error shown, can retry with different card

---

## Test Case 3: Cancelled Checkout

**Objective**: User can abandon checkout without issues

**Steps**:
1. [ ] Navigate to `/upgrade`
2. [ ] Click "Upgrade Now"
3. [ ] Verify checkout form appears
4. [ ] Click browser back button
5. [ ] Verify back on `/upgrade` page
6. [ ] Alternatively: Close form / navigate away
7. [ ] Verify no errors in console

**Expected Result**: ✓ Can return to upgrade page without consequences

---

## Test Case 4: Navbar Integration

**Objective**: Upgrade button accessible from all locations

**Steps (Desktop)**:
1. [ ] On home page, verify "Upgrade" pill visible in navbar
2. [ ] Click it, verify goes to `/upgrade`
3. [ ] In user dropdown, click "Upgrade to Team"
4. [ ] Verify goes to `/upgrade`

**Steps (Mobile)**:
1. [ ] Set viewport to mobile (375x667)
2. [ ] Click hamburger menu
3. [ ] Verify "Upgrade to Team" option visible
4. [ ] Click it, verify goes to `/upgrade`

**Expected Result**: ✓ Button accessible in all three navbar locations

---

## Test Case 5: Settings Page Integration

**Objective**: Upgrade card visible in settings

**Steps**:
1. [ ] Navigate to `/settings`
2. [ ] Scroll to find "Upgrade Your Plan" section
3. [ ] Verify card displays:
   - [ ] Orange gradient background
   - [ ] ⚡ Zap icon
   - [ ] "Upgrade Your Plan" heading
   - [ ] Description text
   - [ ] "Upgrade to Team — $199/mo" button
4. [ ] Click button
5. [ ] Verify navigates to `/upgrade`

**Expected Result**: ✓ Card visible and functional

---

## Test Case 6: Email Pre-Fill

**Objective**: User email is pre-filled in checkout

**Steps**:
1. [ ] Sign up with email: `testuser@example.com`
2. [ ] Navigate to `/upgrade`
3. [ ] Click "Upgrade Now"
4. [ ] Inspect email field in checkout
5. [ ] Verify email shows: `testuser@example.com`
6. [ ] User should NOT need to enter email

**Expected Result**: ✓ Email automatically pre-filled from auth

---

## Test Case 7: Success Page Details

**Objective**: Success page displays correct subscription info

**Steps**:
1. [ ] Complete successful payment with $199/month card
2. [ ] On success page, verify displayed:
   - [ ] Subscription ID (like `sub_1ABC...`)
   - [ ] Product name: "FORGE Team Plan"
   - [ ] Price: "$199.00"
   - [ ] Interval: "month"
   - [ ] Status: "active"
3. [ ] Click "Go to Dashboard"
4. [ ] Verify redirects to `/dashboard`

**Expected Result**: ✓ All details match Stripe subscription

---

## Test Case 8: Price Validation

**Objective**: Server validates price, client cannot manipulate

**Steps**:
1. [ ] Open browser DevTools (F12)
2. [ ] Navigate to `/upgrade`
3. [ ] In DevTools, attempt to modify price (not possible in EmbeddedCheckout)
4. [ ] Complete payment normally
5. [ ] Verify charged amount is always $199.00
6. [ ] Check Stripe Dashboard to confirm $19,900 cents charged

**Expected Result**: ✓ Price always $199, cannot be modified by client

---

## Test Case 9: Responsive Design

**Objective**: Upgrade flow works on all screen sizes

**Steps**:
1. [ ] Test desktop (1920x1080):
   - [ ] Upgrade page looks good
   - [ ] Checkout loads properly
2. [ ] Test tablet (768x1024):
   - [ ] Layout adapts
   - [ ] Form is readable
3. [ ] Test mobile (375x667):
   - [ ] All elements visible
   - [ ] No overflow or scrolling issues
   - [ ] Buttons are tappable (44px+)

**Expected Result**: ✓ Works on all screen sizes

---

## Test Case 10: Error Handling

**Objective**: App handles errors gracefully

**Steps**:
1. [ ] Test network error:
   - [ ] Open DevTools Network tab
   - [ ] Set to "Offline"
   - [ ] Try to submit checkout
   - [ ] Verify error message (not blank screen)
2. [ ] Test invalid session:
   - [ ] Manually edit URL to `/upgrade/success?sessionId=invalid`
   - [ ] Verify graceful error (not crash)
3. [ ] Test unauthenticated access:
   - [ ] Sign out
   - [ ] Try to access `/upgrade`
   - [ ] Verify redirected to login

**Expected Result**: ✓ All errors handled, no blank screens

---

## Test Case 11: Browser Compatibility

**Objective**: Works in major browsers

**Steps**:
- [ ] Chrome/Edge: Test checkout and payment
- [ ] Firefox: Test checkout and payment
- [ ] Safari: Test checkout and payment (if available)
- [ ] Mobile Safari: Test on actual device if possible

**Expected Result**: ✓ Works in all tested browsers

---

## Integration Tests

### Stripe Dashboard Verification

After successful payment:
1. [ ] Log into https://dashboard.stripe.com/
2. [ ] Select **Test Mode** (top right toggle)
3. [ ] Navigate to **Customers**
4. [ ] Find customer with your test email
5. [ ] Click to view details
6. [ ] Verify subscription shows:
   - [ ] Status: "Active"
   - [ ] Product: "FORGE Team Plan"
   - [ ] Current price: "$199.00/month"
7. [ ] Navigate to **Payments**
8. [ ] Verify payment appears:
   - [ ] Amount: "$199.00"
   - [ ] Status: "Succeeded"
   - [ ] Test card used: `4242`

---

## Performance Tests

### Load Testing

```bash
# Check that checkout page loads quickly
agent-browser vitals "http://localhost:3000/upgrade" --json
```

**Acceptable metrics**:
- LCP (Largest Contentful Paint): < 2500ms
- FCP (First Contentful Paint): < 1800ms
- CLS (Cumulative Layout Shift): < 0.1

---

## Security Tests

- [ ] Secret key never logged: Check DevTools console
- [ ] Card data never in network requests: Inspect Network tab
- [ ] Only Stripe API called for payment: Verify in Network tab
- [ ] Session tokens not exposed: Check localStorage/cookies

---

## Regression Tests

Before deploying changes:

- [ ] Run Test Case 1 (successful payment)
- [ ] Run Test Case 2 (declined payment)
- [ ] Run Test Case 4 (navbar buttons)
- [ ] Run Test Case 5 (settings page)

---

## Sign-Off

| Item | Status | Notes |
|------|--------|-------|
| All test cases passed | [ ] | __________ |
| No console errors | [ ] | __________ |
| No network errors | [ ] | __________ |
| Stripe dashboard synced | [ ] | __________ |
| Responsive design verified | [ ] | __________ |
| Ready for production | [ ] | __________ |

---

## Quick Reference

| Test | Card | Expected |
|------|------|----------|
| Success | `4242 4242 4242 4242` | ✓ Charged |
| Decline | `4000 0000 0000 0002` | ✗ Declined |
| 3D Secure | `4000 0025 0000 3155` | 🔐 2FA |
| Insufficient | `4000 0000 0000 9995` | ❌ Failed |

All: Any future date + any 3-digit CVC

---

## Documentation

Refer to:
- `docs/PAYMENT_QUICK_START.md` — 30-second overview
- `docs/STRIPE_SANDBOX_GUIDE.md` — Complete guide
- `docs/PAYMENT_FLOW.md` — Technical diagrams
