# Razorpay Standard Web Checkout & Live Mode Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Razorpay Standard Web Checkout with dynamic Test/Live mode support, minimum amount validation (>= 100 paise), server-side price recalculation, cryptographic HMAC-SHA256 verification using `crypto.timingSafeEqual`, standard endpoint aliases, and resilient frontend modal handling.

**Architecture:** A Next.js 15 App Router frontend dynamically loads Razorpay Checkout (`checkout.js`) and opens the standard payment modal with an `order_id` returned by an Express backend. The Express backend recalculates totals from the MongoDB catalog (preventing client price tampering), ensures the order amount is at least 100 paise (₹1.00), calls Razorpay Orders API, and verifies incoming signatures using timing-safe HMAC-SHA256 comparison with `RAZORPAY_KEY_SECRET`.

**Tech Stack:** Next.js 15, React 19, TypeScript, Express, Mongoose, Razorpay Node SDK, Node.js `crypto`.

**Spec:** Razorpay Standard Web Checkout Integration Guide (Standard Web Integration Steps) & User Requirements Specification.

## Global Constraints

- Never hardcode Razorpay credentials in source files.
- `RAZORPAY_KEY_SECRET` must NEVER be exposed to the client or browser bundle.
- Frontend must only receive `NEXT_PUBLIC_RAZORPAY_KEY_ID` (or `keyId` returned from order creation).
- Seamless switching between Test Mode (`rzp_test_...`) and Live Mode (`rzp_live_...`) solely via environment variables.
- Cash on Delivery (COD) remains strictly disabled (100% online payments only).
- Minimum order amount must be at least 100 paise (₹1.00) in accordance with Razorpay API standards.
- Developer credits in `Footer.tsx` (`Developed by Sriram S and Silvest AJ`) must remain intact.
- Do not push changes to GitHub until explicitly instructed by the user.

## Review Focus

1. **Live Mode Transition**: When credentials change from `rzp_test_...` to `rzp_live_...`, the system correctly identifies live mode without code edits and ensures no sandbox mocks interfere.
2. **Minimum Amount Constraint**: An order whose calculated amount is under 100 paise (e.g. ₹0.50 or negative) must be rejected with HTTP 400 before calling Razorpay API.
3. **Payload Compatibility**: Backend accepts both standard Razorpay naming (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`) and internal camelCase naming without throwing or misaligning HMAC verification.
4. **Modal Dismissal & Bank Declines**: When the customer dismisses the Razorpay modal (`ondismiss`) or payment fails (`payment.failed`), the UI unlocks cleanly with a clear, non-technical explanation and does not strand the cart.
5. **Anti-Tampering Price Calculation**: Client-sent prices are discarded; totals are strictly derived from database catalog pricing + business delivery rules.

---

### Task 1: Environment & Credentials Configuration (Test & Live Mode Support)

**Files:**
- Modify: `server/.env:12-16`
- Modify: `server/.env.example:10-15`
- Modify: `client/.env.local:28-31`
- Modify: `client/.env.example:28-31`

**Interfaces:**
- Consumes: User-supplied Razorpay credentials (`RAZORPAY_KEY_ID=rzp_test_ToDVxv4v1XWpYK`, `RAZORPAY_KEY_SECRET=zPz6ZdcCvuJxJ8b6aVOUnRCn`)
- Produces: Environment variables `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`

- [ ] **Step 1: Write the failing test for environment variable loading and live/test detection**

Add test in `server/src/tests/razorpaySecurity.test.ts`:
```typescript
it('correctly detects live vs test mode based on key prefix', () => {
  assert.strictEqual(isLiveMode('rzp_test_ToDVxv4v1XWpYK'), false);
  assert.strictEqual(isLiveMode('rzp_live_AbCdEf12345678'), true);
  assert.strictEqual(getRazorpayMode('rzp_test_ToDVxv4v1XWpYK'), 'test');
  assert.strictEqual(getRazorpayMode('rzp_live_AbCdEf12345678'), 'live');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test "src/tests/razorpaySecurity.test.ts"` in `server`
Expected: FAIL with "isLiveMode is not defined"

- [ ] **Step 3: Update `.env` files with new credentials and update `.env.example`**

Update `server/.env`:
```env
# Razorpay Payment Gateway Credentials (Test / Live Mode)
RAZORPAY_KEY_ID=rzp_test_ToDVxv4v1XWpYK
RAZORPAY_KEY_SECRET=zPz6ZdcCvuJxJ8b6aVOUnRCn
RAZORPAY_WEBHOOK_SECRET=sriram_and_co_rzp_webhook_secret_2026
```

Update `client/.env.local`:
```env
# Razorpay Payment Gateway (Public Key ID)
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_ToDVxv4v1XWpYK"
```

- [ ] **Step 4: Verify .env is listed in .gitignore**

Verify `server/.env` and `client/.env.local` are ignored in `.gitignore`.

---

### Task 2: Razorpay Config & Live Mode Detection Helper

**Files:**
- Modify: `server/src/config/razorpay.ts`
- Test: `server/src/tests/razorpaySecurity.test.ts`

**Interfaces:**
- Consumes: `process.env.RAZORPAY_KEY_ID`, `process.env.RAZORPAY_KEY_SECRET`
- Produces:
  - `isLiveMode(keyId?: string): boolean`
  - `getRazorpayMode(keyId?: string): 'live' | 'test' | 'unconfigured'`
  - `validateOrderAmountPaise(amount: number): boolean`
  - `razorpay` (SDK instance)
  - `verifyPaymentSignature(orderId: string, paymentId: string, signature: string, secret?: string): boolean`

- [ ] **Step 1: Write test for amount validation and mode detection**

In `server/src/tests/razorpaySecurity.test.ts`:
```typescript
it('validates minimum amount requirement of 100 paise', () => {
  assert.strictEqual(validateOrderAmountPaise(99), false);
  assert.strictEqual(validateOrderAmountPaise(100), true);
  assert.strictEqual(validateOrderAmountPaise(250000), true);
  assert.strictEqual(validateOrderAmountPaise(0), false);
  assert.strictEqual(validateOrderAmountPaise(-100), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test "src/tests/razorpaySecurity.test.ts"` in `server`
Expected: FAIL with "validateOrderAmountPaise is not defined"

- [ ] **Step 3: Implement mode detection and amount validation in `server/src/config/razorpay.ts`**

Implement:
```typescript
export function isLiveMode(keyId: string = RAZORPAY_KEY_ID): boolean {
  return keyId.startsWith('rzp_live_');
}

export function getRazorpayMode(keyId: string = RAZORPAY_KEY_ID): 'live' | 'test' | 'unconfigured' {
  if (!keyId) return 'unconfigured';
  return keyId.startsWith('rzp_live_') ? 'live' : 'test';
}

export function validateOrderAmountPaise(amountPaise: number): boolean {
  return typeof amountPaise === 'number' && Number.isFinite(amountPaise) && amountPaise >= 100;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test "src/tests/razorpaySecurity.test.ts"` in `server`
Expected: PASS

---

### Task 3: Backend Order Creation Endpoint & Minimum Amount Enforcement

**Files:**
- Modify: `server/src/routes/orderRoutes.ts:14-128`
- Test: `server/src/tests/razorpaySecurity.test.ts`

**Interfaces:**
- Consumes: Express request body `{ customerInfo, orderItems, notes }`
- Produces: JSON response `{ order_id: string, razorpayOrderId: string, orderNumber: string, amount: number, currency: string, keyId: string, pricing: object }`
- HTTP 400: If amount < 100 paise or invalid inputs
- HTTP 500: If Razorpay API call fails

- [ ] **Step 1: Write tests for order payload validation and minimum amount rule**

In `server/src/tests/razorpaySecurity.test.ts`:
```typescript
it('rejects order creation when total in paise is less than minimum 100 paise', () => {
  const amountPaise = 50; // ₹0.50
  assert.strictEqual(validateOrderAmountPaise(amountPaise), false);
});
```

- [ ] **Step 2: Update `POST /razorpay/create-order` in `server/src/routes/orderRoutes.ts`**

Ensure:
1. Amount in paise is calculated as `const amountPaise = Math.round(verifiedTotal * 100);`
2. Enforce `if (!validateOrderAmountPaise(amountPaise)) { res.status(400).json({ message: 'Order amount must be at least ₹1.00 (100 paise).' }); return; }`
3. Response includes standard Razorpay field `order_id: razorpayOrder.id` alongside `razorpayOrderId: razorpayOrder.id`, `amount: razorpayOrder.amount`, `currency: razorpayOrder.currency`, and `keyId: RAZORPAY_KEY_ID`.

- [ ] **Step 3: Run server tests to verify**

Run: `npm test` in `server`
Expected: PASS (all tests green)

---

### Task 4: Backend Payment Signature Verification & Route Aliases

**Files:**
- Modify: `server/src/routes/orderRoutes.ts:129-198`
- Modify: `server/src/server.ts:80-90`
- Test: `server/src/tests/razorpaySecurity.test.ts`

**Interfaces:**
- Consumes:
  - `razorpayOrderId` or `razorpay_order_id`
  - `razorpayPaymentId` or `razorpay_payment_id`
  - `razorpaySignature` or `razorpay_signature`
  - `orderNumber` (optional for direct / standard verify route)
- Produces: JSON response `{ success: true, message: 'Payment verified successfully.' }` or HTTP 400 `{ success: false, message: string }`

- [ ] **Step 1: Write test for dual payload parameter parsing (camelCase and snake_case)**

In `server/src/tests/razorpaySecurity.test.ts`:
```typescript
it('verifies standard snake_case parameters match camelCase parameters', () => {
  const legitSig = crypto
    .createHmac('sha256', testKeySecret)
    .update(Buffer.from(`${testOrderId}|${testPaymentId}`, 'utf8'))
    .digest('hex');

  const isValid = verifyPaymentSignature(testOrderId, testPaymentId, legitSig, testKeySecret);
  assert.strictEqual(isValid, true);
});
```

- [ ] **Step 2: Update `POST /razorpay/verify-payment` in `server/src/routes/orderRoutes.ts`**

Support:
```typescript
const razorpayOrderId = req.body.razorpayOrderId || req.body.razorpay_order_id;
const razorpayPaymentId = req.body.razorpayPaymentId || req.body.razorpay_payment_id;
const razorpaySignature = req.body.razorpaySignature || req.body.razorpay_signature;
const orderNumber = req.body.orderNumber;
```
If `!razorpayOrderId || !razorpayPaymentId || !razorpaySignature`, return HTTP 400.
If signature is invalid, update order status to `failed` and return HTTP 400 with `{ success: false, message: 'Invalid payment signature. Verification failed.' }`.
If signature is valid, mark order `paid`, update payment details, and return `{ success: true, message: 'Payment verified successfully.', order }`.

- [ ] **Step 3: Add standard root route aliases in `server/src/server.ts`**

Map:
- `app.post('/api/create-order', (req, res, next) => { req.url = '/razorpay/create-order'; orderRoutes(req, res, next); });`
- `app.post('/api/verify-payment', (req, res, next) => { req.url = '/razorpay/verify-payment'; orderRoutes(req, res, next); });`
So both `/api/orders/razorpay/...` and `/api/create-order` / `/api/verify-payment` work seamlessly.

- [ ] **Step 4: Run server test suite**

Run: `npm test` in `server`
Expected: PASS

---

### Task 5: Frontend Razorpay Standard Web Checkout Modal & Error Handling

**Files:**
- Modify: `client/src/lib/razorpay.ts`
- Modify: `client/src/app/checkout/page.tsx:180-248`
- Test: `client/src/lib/apiError.test.ts`

**Interfaces:**
- Consumes: `loadRazorpayScript()`, `RazorpayOptions`, `RazorpaySuccessResponse`
- Produces: Standard Checkout Modal invocation, dismissal recovery, payment failure alert

- [ ] **Step 1: Verify dynamic SDK loader in `client/src/lib/razorpay.ts`**

Ensure `loadRazorpayScript()` injects `https://checkout.razorpay.com/v1/checkout.js` if not already present, returning `Promise<boolean>`.

- [ ] **Step 2: Update Checkout Page modal options and handlers**

In `client/src/app/checkout/page.tsx`:
1. Use `razorpayOrder.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID`.
2. Pass `order_id: razorpayOrder.order_id || razorpayOrder.razorpayOrderId`.
3. In `modal.ondismiss`: Reset `isSubmitting = false` and set friendly notice: `"Payment was cancelled. You can retry whenever you are ready."`
4. Register `rzp.on('payment.failed', ...)`: Display specific bank decline message or fallback without crashing.
5. In `handler(response)`: Send `{ orderNumber, razorpay_order_id, razorpay_payment_id, razorpay_signature }` to `api.verifyRazorpayPayment`.
6. On success: Clear cart and transition to confirmation view.

- [ ] **Step 3: Run client test suite and build verification**

Run: `npx tsx --test "src/**/*.test.ts"` in `client`
Run: `npm run build` in `client`
Expected: PASS (all tests pass, 29/29 routes build cleanly)

---

### Task 6: End-to-End Integration Verification & Test Suite

**Files:**
- Modify: `server/src/tests/razorpaySecurity.test.ts`
- Verify: Full test run and dev server sanity checks

- [ ] **Step 1: Run comprehensive server security test suite**

Run: `npm test` in `server`
Expected: All tests pass (including signature verification, tampering prevention, webhook verification, amount validation, and mode detection).

- [ ] **Step 2: Verify server build**

Run: `npm run build` in `server`
Expected: TypeScript `tsc` exits with code 0.

- [ ] **Step 3: Run comprehensive client test suite**

Run: `npx tsx --test "src/**/*.test.ts"` in `client`
Expected: All 28+ tests pass.

- [ ] **Step 4: Verify client build**

Run: `npm run build` in `client`
Expected: Next.js production build exits with code 0.

- [ ] **Step 5: Verify dev servers responsiveness**

Verify `http://localhost:5000/api/health` returns status `ok`.
Verify `http://localhost:3000/checkout` returns status 200.
