# Customer Product Return Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow customers to request an item-level return for delivered products directly from their Order History / Account page within a 7-day warranty window, capture structured fault reasons and policy agreement, record the return in MongoDB, and automatically notify the merchant (`ramkumar@sriramandco.in`) and customer via email.

**Architecture:**
- **Database**: Add `returnRequest` subdocument to the Order schema tracking item returned, reason, fault review notes, policy agreement, and return lifecycle status.
- **Backend API**: Implement `POST /api/orders/:id/return` in Express with 7-day window validation, customer authorization, database mutation, and merchant email dispatch.
- **Frontend UI**: Create a responsive `ReturnProductModal` in Next.js attached to delivered items in `/orders` and `/account`, complete with fault category selector, feedback notes, policy agreement checkboxes, and instant feedback.
- **Transactional Email**: Compile clean Sri Ram & Co branded merchant notification and customer acknowledgment templates using Zoho Mail.

**Tech Stack:** Next.js 15, React 19, TypeScript, Express, Mongoose, Nodemailer, Zoho Mail SMTP.

**Spec:** Decisions aligned: 7-day return window (Option A), Item-level returns (Option A), Dual customer + merchant email notifications (Option A).

## Global Constraints
- Only orders with `orderStatus === 'delivered'` are eligible for return.
- Returns must be requested within 7 days (168 hours) of the delivery timestamp.
- Customer must actively tick the checkbox agreeing to Terms & Conditions, Return Policy, and Refund Policy.
- Email to merchant (`ramkumar@sriramandco.in`) must include customer name, phone, address, product, reason, and notes, with customer email set as `replyTo`.
- Maintain OWASP rate limiting and data validation via Zod schemas.

---

### Task 1: Order Model & Schema Extension
- [ ] Define `IReturnRequest` interface and update `IOrder` in `server/src/models/Order.ts`.
- [ ] Add `returnRequest` schema with fields: `itemId`, `name`, `price`, `quantity`, `image`, `reason`, `faultDetails`, `agreedToPolicy`, `status: 'requested' | 'approved' | 'rejected' | 'picked_up' | 'refunded'`, `requestedAt`, `resolvedAt`.
- [ ] Write unit tests in `server/src/tests/returnOrder.test.ts` verifying schema validation, default status, and policy flag requirement.
- [ ] Run test suite: `npm test --prefix server`.

### Task 2: Return Email Templates & Service Dispatch
- [ ] Add `compileMerchantReturnEmailHtml(order, returnRequest)` in `server/src/services/emailTemplates.ts` detailing customer contact, product, fault reason, notes, and order timestamp.
- [ ] Add `compileCustomerReturnAckEmailHtml(order, returnRequest)` assuring customer that support will review within 2 business days.
- [ ] Add unit test verifying HTML and text generation with proper fields and styling.
- [ ] Update `client/src/app/api/email/send/route.ts` to support `templateType === 'return_request'`.

### Task 3: Backend API Endpoint (`POST /api/orders/:id/return`)
- [ ] Define Zod schema `ReturnRequestSchema` in `server/src/routes/orderRoutes.ts` validating `itemId`, `reason`, `faultDetails`, and `agreedToPolicy === true`.
- [ ] Implement `POST /api/orders/:id/return`:
  - Validate order exists and belongs to authenticated user (or matches customer email).
  - Verify `order.orderStatus === 'delivered'`.
  - Verify delivery time is within 7 days (`Date.now() - order.updatedAt <= 7 * 24 * 60 * 60 * 1000`).
  - Check no active return already exists for this order item.
  - Save `order.returnRequest` and update `order.orderStatus = 'return_requested'`.
  - Dispatch merchant email to `ramkumar@sriramandco.in`.
  - Return `{ success: true, message: 'Return request submitted successfully', returnRequest }`.
- [ ] Write integration tests in `server/src/tests/returnOrder.test.ts` verifying valid return, expired 7-day rejection, and duplicate return rejection.
- [ ] Run tests and compile: `npm test --prefix server` and `npm run build --prefix server`.

### Task 4: Frontend Return Modal & Account Integration
- [ ] Create `client/src/components/orders/ReturnProductModal.tsx`:
  - Shows product summary (image, name, price, qty).
  - Reason dropdown (Damaged item, Defective, Mismatched description, Missing parts, Quality issue).
  - Detailed fault textarea with minimum 10 characters.
  - Checkbox: "I agree to Terms & Conditions, Return Policy (7-day window), and Refund Policy".
  - Submit action with loading spinner and error alerts.
- [ ] Update `client/src/lib/api.ts` with `api.requestReturn(orderId, payload)`.
- [ ] In `client/src/app/orders/page.tsx`:
  - Check if `order.orderStatus === 'delivered'`.
  - Check if delivered within 7 days: render "Return Product" button under item.
  - If return already submitted (`order.returnRequest`), render badge: "Return Requested (Under Review)".
- [ ] Verify responsive styling in mobile and desktop viewports.

### Task 5: Build Verification & Deployment
- [ ] Run full server tests: `npm test --prefix server`.
- [ ] Run client production build: `npm run build --prefix client`.
- [ ] Commit with descriptive message and push to `main` and sync `silvest`.
