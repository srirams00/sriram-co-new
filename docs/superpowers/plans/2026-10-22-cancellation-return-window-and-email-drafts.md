# Cancellation Dialog, 3-Day Return Window, and Email Drafts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine order cancellation to show exclusively for paid pre-dispatch orders with an interactive reason dialog; dispatch cancellation alerts to both the customer and `ramkumar@sriramandco.in`; update the customer return window from 7 days to 3 days (72 hours); and send complete draft previews of all designed transactional emails to `ramkumar@sriramandco.in`.

**Architecture:** 
- Frontend: Order card logic in Next.js (`client/src/app/orders/page.tsx`) updated to gate the Cancel button strictly on `paymentStatus === 'paid'` and pre-dispatch status (`placed`, `confirmed`, `processing`), opening an enhanced cancellation modal with curated reasons.
- Backend: `POST /api/orders/:idOrNumber/cancel` in `orderRoutes.ts` updated to dispatch both customer confirmation and merchant alert to `ramkumar@sriramandco.in`.
- Policy & Verification: 7-day cutoff updated to 3-day (72-hour) cutoff across client validation, server route, and policy copy.
- Email Dispatch Engine: Script/endpoint generating and sending styled drafts of all email templates to `ramkumar@sriramandco.in`.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.7, Express, Node.js, Nodemailer / Zoho SMTP Relay, CSS Modules.

**Spec:** [`CONSTRAINTS.md`](file:///c:/Users/Silvest%20AJ/Documents/project-4/CONSTRAINTS.md) and User Request.

---

## Global Constraints

* **Zero Suppressions**: No `@ts-ignore`, no skipped tests.
* **Non-Degradation Floor**: Maintain all existing 125 server tests and 57 client tests.
* **Return Window**: Strictly 3 days (`3 * 24 * 60 * 60 * 1000` / 72 hours).
* **Target Merchant Email**: `ramkumar@sriramandco.in`.
* **Execution Budget**: Focused test verification < 30 seconds.

## Review Focus

1. **Pre-Dispatch Status Leak**: Ensure Cancel button disappears immediately when order status updates to `shipped` or `out_for_delivery`.
2. **Unpaid Order Edge Case**: If an order was created but payment failed (`failed` or `pending`), do not show cancellation/refund button; only show for `paid`.
3. **3-Day Boundary Jitter**: Boundary comparison must allow a small clock drift tolerance so 72.0 hours isn't rejected by millisecond network latency.
4. **Email Relay Forwarding**: Cancellation merchant alert must pass through the Vercel HTTPS relay without getting blocked by Render firewall.
5. **Customer & Merchant Dual Dispatch**: Customer receives cancellation confirmation + refund SLA, merchant receives cancellation alert with customer notes.

---

## File Structure & Responsibilities

| File Path | Action | Responsibility |
|---|---|---|
| `client/src/app/orders/page.tsx` | Modify | Update Cancel button condition (`paymentStatus === 'paid' && isPreDispatch`), update 3-day return banner copy, enhance cancellation modal with curated reasons. |
| `client/src/lib/returnValidation.ts` | Modify | Update `returnWindowMs` from 7 days to 3 days (`3 * 24 * 60 * 60 * 1000`). |
| `client/src/lib/returnValidation.test.ts` | Modify | Update unit tests from 7-day to 3-day assertions. |
| `server/src/routes/orderRoutes.ts` | Modify | Update return route cutoff to 3 days; update cancel route to dispatch merchant alert to `ramkumar@sriramandco.in`; add batch preview email endpoint. |
| `server/src/services/emailTemplates.ts` | Modify | Add `compileMerchantCancellationEmailHtml` template; update delivery email template copy from 7-day to 3-day replacement. |
| `server/src/tests/orderCancellation.test.ts` | Modify | Add test for merchant cancellation alert dispatch and pre-dispatch paid gating. |
| `server/src/tests/returnOrder.test.ts` | Modify | Update 7-day tests to 3-day warranty assertions. |
| `server/scripts/sendAllEmailDrafts.ts` | Create | Standalone verification script compiling and sending all 9 email templates to `ramkumar@sriramandco.in`. |

---

## Task Breakdown

### Task 1: Update Return Eligibility Window from 7 Days to 3 Days

**Files:**
- Modify: `client/src/lib/returnValidation.ts`
- Modify: `client/src/lib/returnValidation.test.ts`
- Modify: `server/src/routes/orderRoutes.ts`
- Modify: `server/src/services/emailTemplates.ts`
- Modify: `server/src/tests/returnOrder.test.ts`
- Modify: `client/src/app/orders/page.tsx`

- [ ] **Step 1: Write failing tests for 3-day cutoff**
  Update `server/src/tests/returnOrder.test.ts` and `client/src/lib/returnValidation.test.ts` to assert that 2 days is eligible, 3 days is eligible, and 4 days is expired.
- [ ] **Step 2: Run tests to verify failure (RED)**
  `npx tsx --test server/src/tests/returnOrder.test.ts`
- [ ] **Step 3: Implement 3-day cutoff (GREEN)**
  Update `returnWindowMs = 3 * 24 * 60 * 60 * 1000` in `server/src/routes/orderRoutes.ts` and `client/src/lib/returnValidation.ts`.
  Update UI copy from "7-Day Store Replacement Policy" to "3-Day Store Replacement Policy" in `client/src/app/orders/page.tsx` and `server/src/services/emailTemplates.ts`.
- [ ] **Step 4: Run tests to verify pass (GREEN)**
  `npx tsx --test server/src/tests/returnOrder.test.ts` and `npx tsx --test client/src/lib/returnValidation.test.ts`.

---

### Task 2: Refine Cancellation Button, Modal Dialog, & Dual Email Dispatch

**Files:**
- Modify: `client/src/app/orders/page.tsx`
- Modify: `server/src/routes/orderRoutes.ts`
- Modify: `server/src/services/emailTemplates.ts`
- Modify: `server/src/tests/orderCancellation.test.ts`

- [ ] **Step 1: Write failing tests for Merchant Cancellation Email**
  Add test asserting that `compileMerchantCancellationEmailHtml` produces correct subject with order number, customer reason, refund amount, and phone number.
- [ ] **Step 2: Implement `compileMerchantCancellationEmailHtml` in `emailTemplates.ts`**
  Generate branded merchant alert for pre-dispatch cancellations.
- [ ] **Step 3: Wire Dual Email Dispatch in `orderRoutes.ts`**
  In `POST /api/orders/:idOrNumber/cancel`, send confirmation to customer AND merchant alert to `ramkumar@sriramandco.in`.
- [ ] **Step 4: Update Frontend Cancel Button Gating & Modal in `OrdersPage`**
  Ensure Cancel button only renders if `order.paymentStatus === 'paid'` AND `['placed', 'confirmed', 'processing'].includes(order.orderStatus)`.
  Dialog includes reasons:
  - "Changed mind / Placed by mistake"
  - "Found a lower price elsewhere"
  - "Delivery address or phone number needs correction"
  - "Need to modify items or quantities in this order"
  - "Expected faster delivery time"
  - "Other (provide details below)"
- [ ] **Step 5: Run tests to verify pass**
  `npx tsx --test server/src/tests/orderCancellation.test.ts`

---

### Task 3: Send Complete Draft Previews of All Designed Emails to `ramkumar@sriramandco.in`

**Files:**
- Create: `server/scripts/sendAllEmailDrafts.ts`
- Modify: `server/src/routes/orderRoutes.ts` (expose `/admin/send-all-draft-previews`)

- [ ] **Step 1: Write Draft Dispatch Engine**
  Script compiling sample orders and return requests for all 9 designed templates:
  1. `Order Placed` (`placed`)
  2. `Order Confirmed` (`confirmed`)
  3. `Order Processing` (`processing`)
  4. `Order Shipped` (`shipped`)
  5. `Order Out for Delivery` (`out_for_delivery`)
  6. `Order Delivered` (`delivered` - with 3-day return policy)
  7. `Order Cancelled` (`cancelled` - customer confirmation)
  8. `Merchant Cancellation Alert` (sent to `ramkumar@sriramandco.in`)
  9. `Customer Return Request Acknowledgment` (`return_ack`)
  10. `Merchant Return Alert` (sent to `ramkumar@sriramandco.in`)
  11. `Customer Return Resolution` (Approved, Rejected, Refunded)
  12. `Password Recovery Reset Link`
- [ ] **Step 2: Run Draft Dispatch Script**
  Execute `npx tsx server/scripts/sendAllEmailDrafts.ts` to dispatch drafts directly to `ramkumar@sriramandco.in`.
- [ ] **Step 3: Verify transmission logs**
  Check message IDs and transmission results.

---

### Task 4: Full Quality Gate & Pre-Deployment Verification

- [ ] Run `npm test --prefix server` (must pass ≥ 125 tests, 0 failures).
- [ ] Run `npm test --prefix client` (must pass ≥ 57 tests, 0 failures).
- [ ] Run `npm run build --prefix server` (zero TypeScript errors).
- [ ] Run `npm run build --prefix client` (all 37 pages compile cleanly).
- [ ] Verify Definition of Done checklist.
