# Implementation Plan: Transactional Email System with Zoho Mail, Admin Studio & Order Lifecycle Integration

## Overview
Implement an end-to-end transactional email notification system for Sri Ram & Co using the official **Zoho Mail** mailbox for **`ramkumar@sriramandco.in`**. When a customer places an order or an administrator updates an order's status in the admin dashboard, the system automatically dispatches branded, mobile-responsive HTML emails from `ramkumar@sriramandco.in`. The solution includes a Nodemailer transport tailored for Zoho Mail (`smtppro.zoho.in` / `smtp.zoho.com`), a backend HTML template compiler generating the 6 user-designed email states, an interactive Email Studio (`/admin/emails`) with desktop and mobile previews, and dynamic order status update buttons with delivery driver assignment in the Admin Orders dashboard.

## Architecture Decisions
- **Zoho Mail SMTP Transport (ADR-012)**: Use Nodemailer connected directly to the existing Zoho Mail account for `ramkumar@sriramandco.in`:
  - `SMTP_HOST`: `smtppro.zoho.in` (default for India region accounts) or `smtp.zoho.com`
  - `SMTP_PORT`: `465` (secure SSL) or `587` (STARTTLS)
  - `SMTP_SECURE`: `true` (when using 465)
  - `SMTP_USER`: `ramkumar@sriramandco.in`
  - `SMTP_PASS`: Zoho Application-Specific Password
  - `EMAIL_FROM`: `"Sri Ram & Co" <ramkumar@sriramandco.in>`
  - If credentials are not yet set or in offline test environments, the service operates in simulated mode (logging full email payloads to console) so checkout and order workflows are never blocked.
- **Server-Side Clean HTML Compiler**: Pre-compile the 6 transactional templates into bulletproof HTML tables with inline styling, matching the design specifications (brand green `#147b3d`, WhatsApp `#18a957`, Trichy and Chennai store locations, GSTIN `33ARHPR6139B1ZX`, and phone `+91 93454 03136`).
- **Interactive Email Studio in Admin**: Provide an admin view at `/admin/emails` allowing store operators to preview each template at 600px desktop and 375px mobile viewports, inspect merge tags, and send test emails via Zoho Mail.
- **Decoupled Order Lifecycle Hooks**: Order status transitions in `/admin/orders` trigger asynchronous email delivery without delaying HTTP responses. Driver information for `out_for_delivery` is captured via an intuitive popup prompt.

---

## Task List

### Phase 1: Foundation (Zoho Mail Service & Server HTML Template Compiler)

- [ ] **Task 1: Install Nodemailer & Configure Zoho Mail Environment Variables**
  - **Description**: Add `nodemailer` and `@types/nodemailer` to `server`, configure Zoho Mail SMTP environment variables in `server/.env` and `server/.env.example` with sender `ramkumar@sriramandco.in`, and ensure credentials remain secured in `.gitignore`.
  - **Acceptance criteria**:
    - `nodemailer` installed in `server/package.json`.
    - `server/.env` and `server/.env.example` include:
      ```env
      # Zoho Mail Transactional SMTP Configuration
      SMTP_HOST=smtppro.zoho.in
      SMTP_PORT=465
      SMTP_SECURE=true
      SMTP_USER=ramkumar@sriramandco.in
      SMTP_PASS=your_zoho_app_specific_password_here
      EMAIL_FROM="Sri Ram & Co" <ramkumar@sriramandco.in>
      ```
    - `.env` remains gitignored.
  - **Verification**: `npm list nodemailer` in `server` exits cleanly; `.gitignore` checked.
  - **Dependencies**: None.
  - **Files**: `server/package.json`, `server/.env`, `server/.env.example`.
  - **Scope**: S (3 files).

- [ ] **Task 2: Implement Server-Side Email Template Compiler (`server/src/services/emailTemplates.ts`)**
  - **Description**: Build the backend HTML generator producing responsive, email-client-compatible HTML for the 6 lifecycle emails: `placed`, `confirmed`, `processing`, `out_for_delivery`, `delivered`, and `cancelled`.
  - **Acceptance criteria**:
    - Generates table-based HTML with brand colors (`#147b3d`, `#fbfcfa`, `#dce8de`), order summary table, delivery address, GSTIN, store hours, and WhatsApp CTA.
    - Dynamically interpolates order data: customer name, order number, items, pricing, delivery driver (`delivery_person_name`, `delivery_person_phone`, `delivery_window`), and cancellation reasons.
    - Exports `compileOrderEmailHtml(order: any, type: EmailId, meta?: any): { subject: string; html: string; text: string }`.
  - **Verification**: Unit tests in `server/src/tests/emailService.test.ts` verify HTML output and subject lines for all 6 template types.
  - **Dependencies**: Task 1.
  - **Files**: `server/src/services/emailTemplates.ts`, `server/src/tests/emailService.test.ts`.
  - **Scope**: M (2 files).

- [ ] **Task 3: Implement Zoho Mail Email Service (`server/src/services/emailService.ts`)**
  - **Description**: Create the email dispatch service that connects to Zoho Mail SMTP via Nodemailer, or safely falls back to simulated console logging when SMTP is unconfigured or in development.
  - **Acceptance criteria**:
    - Creates reusable `nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_SECURE, auth: { user, pass } })`.
    - Exports `sendEmail({ to, subject, html, text })` returning `{ success: boolean; messageId?: string; simulated?: boolean }`.
    - Exports `sendOrderLifecycleEmail(order: any, type: EmailId, options?: any)`.
    - Never throws an unhandled exception that could interrupt order creation or status updates.
  - **Verification**: Test suite verifies sending in simulated mode, valid connection configuration, and error containment.
  - **Dependencies**: Task 2.
  - **Files**: `server/src/services/emailService.ts`, `server/src/tests/emailService.test.ts`.
  - **Scope**: S (2 files).

### Checkpoint 1: Foundation
- [ ] All server email tests pass (`npm test` in `server`).
- [ ] HTML output generates valid responsive tables with Sri Ram & Co brand standards.
- [ ] Server compiles with zero TypeScript errors (`npm run build` in `server`).

---

### Phase 2: Order Lifecycle Triggers & Admin API Endpoints

- [ ] **Task 4: Integrate Email Dispatch into Order Creation & Status Updates**
  - **Description**: Update `server/src/routes/orderRoutes.ts` so placing an order automatically sends the `placed` email, payment verification triggers `confirmed`, and status updates trigger the matching lifecycle email.
  - **Acceptance criteria**:
    - `POST /razorpay/create-order` triggers `sendOrderLifecycleEmail(savedOrder, 'placed')`.
    - `POST /razorpay/verify-payment` triggers `sendOrderLifecycleEmail(updatedOrder, 'confirmed')`.
    - `PATCH /:id/status` triggers `sendOrderLifecycleEmail(updatedOrder, newStatus, { driver, cancellationReason })`.
    - Email errors are logged as warnings and never fail the HTTP 200 response to the client.
  - **Verification**: Integration tests verify that updating status invokes email dispatch logic.
  - **Dependencies**: Task 3.
  - **Files**: `server/src/routes/orderRoutes.ts`.
  - **Scope**: S (1 file).

- [ ] **Task 5: Add Admin Email Management Endpoints**
  - **Description**: Add dedicated admin endpoints: `POST /api/orders/:id/send-email` (manual on-demand email dispatch) and `POST /api/orders/test-email` (send test email to specified recipient via Zoho Mail).
  - **Acceptance criteria**:
    - `POST /api/orders/:id/send-email`: Protected with `requireAdmin`, accepts `{ templateId, driver, cancellationReason }`, returns `{ success: true, message: string }`.
    - `POST /api/orders/test-email`: Protected with `requireAdmin`, accepts `{ email, templateId }`, sends sample email.
  - **Verification**: HTTP test asserting 200 OK for admin and 401/403 for unauthorized calls.
  - **Dependencies**: Task 4.
  - **Files**: `server/src/routes/orderRoutes.ts`.
  - **Scope**: S (1 file).

### Checkpoint 2: Backend Lifecycle & API
- [ ] Order creation triggers `placed` email.
- [ ] Status transitions trigger corresponding email templates.
- [ ] Manual send endpoint functions properly.
- [ ] Server build and tests clean.

---

### Phase 3: Client Components & Email Studio (`/admin/emails`)

- [ ] **Task 6: Port Email Design System & Components to Client**
  - **Description**: Port the user-supplied raw React email components, types, and theme definitions into `client/src/components/email/`.
  - **Acceptance criteria**:
    - Creates `client/src/types/email.ts` and `client/src/components/email/` structure.
    - Ports `EmailLayout`, `StatusBlock`, `ProgressStrip`, `OrderSummary`, `DeliveryPaymentColumns`, `DeliveryPersonCard`, `HelpStrip`, `EmailFooter`, `EmailHeader`, `EmailButton`, `OutlineButton`, `HighlightCard`, `NumberedList`, `RefundVariants`, `EmailFrame`, `EmailPreview`.
    - Ports the 6 email templates and template registry.
  - **Verification**: TypeScript type checking succeeds (`npm run build` in `client`).
  - **Dependencies**: None (can run in parallel with Phase 2).
  - **Files**: `client/src/types/email.ts`, `client/src/components/email/*`.
  - **Scope**: M (15-20 small component files).

- [ ] **Task 7: Build Admin Email Studio Page (`client/src/app/admin/emails/page.tsx`)**
  - **Description**: Build the interactive email preview studio accessible from the admin dashboard with tabs for all 6 emails, Desktop (600px) and Mobile (375px) side-by-side frames, merge tag toggle, and "Send Test Email" action via Zoho Mail.
  - **Acceptance criteria**:
    - Navigable via `/admin/emails` with tabs for each email state.
    - Toggle for merge tag raw view vs populated values.
    - Toggle for cancellation by store vs customer on the cancelled template.
    - "Send Test Email to..." button triggering backend preview email.
    - Sidebar link in admin navigation to access Email Studio.
  - **Verification**: Browser check / HTTP 200 verification on `/admin/emails`.
  - **Dependencies**: Task 6.
  - **Files**: `client/src/app/admin/emails/page.tsx`, `client/src/components/admin/AdminSidebar.tsx`.
  - **Scope**: M (2 files).

- [ ] **Task 8: Enhance Admin Orders Dashboard with Action Buttons & Driver Assignment**
  - **Description**: In `client/src/app/admin/orders/page.tsx`, add interactive email send buttons to order rows and the details modal, along with a prompt/modal when selecting "Out for Delivery" to capture driver name and phone.
  - **Acceptance criteria**:
    - Changing status in the table dropdown sends the email with real-time feedback toast.
    - If status is changed to `out_for_delivery`, a driver modal appears asking for driver name (default "Murugan"), phone (default "+91 94431 27658"), and delivery window (default "today between 2 PM and 5 PM").
    - "Send Email" action button in order details modal allows re-sending any of the 6 templates.
    - Visual indicator shows when an email is actively dispatching.
  - **Verification**: UI tested with manual order updates; state updates smoothly.
  - **Dependencies**: Task 5, Task 6.
  - **Files**: `client/src/app/admin/orders/page.tsx`, `client/src/lib/api.ts`.
  - **Scope**: M (2 files).

### Checkpoint 3: Complete Frontend & Studio
- [ ] `/admin/emails` renders all 6 templates in Desktop and Mobile views.
- [ ] Admin can change order status and specify driver details for out-for-delivery.
- [ ] Admin can re-send emails on demand.
- [ ] Client build compiles cleanly (`npm run build` in `client`).

---

### Phase 4: Verification, Security & End-to-End Testing

- [ ] **Task 9: End-to-End Verification & Test Suite Execution**
  - **Description**: Run complete test suites on both server and client, verify all 29 routes, and test the email generation across all status states.
  - **Acceptance criteria**:
    - `npm test` in `server` passes 100%.
    - `npx tsx --test "src/**/*.test.ts"` in `client` passes 100%.
    - `npm run build` passes on both server and client with zero errors.
    - Local dev server responds with HTTP 200 on all admin and customer routes.
  - **Verification**: All commands exit with code 0.
  - **Dependencies**: Tasks 1-8.
  - **Files**: Test suites.
  - **Scope**: S.

---

## Risks and Mitigations
| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Zoho Mail SMTP authentication requires Application-Specific Password | Med | Clearly document generation of Zoho App Password under Zoho My Account -> Security -> Application-Specific Passwords; default to fallback simulated mode if not configured. |
| Zoho Mail rate limits on high volume | Low | Transactional order volume is well within Zoho Mail standard limits; email dispatch is asynchronous and errors do not block transactions. |
| Email client rendering quirks (Outlook, Apple Mail) | Med | HTML templates use table-based layouts, explicit pixel dimensions, inline styles, and universal web-safe font fallbacks (`Poppins, Arial, sans-serif`). |
| Missing driver details for Out for Delivery | Low | Defaults to store driver Murugan (`+91 94431 27658`) if admin does not supply custom details. |

## Open Questions
- To enable live sending through Zoho Mail, a Zoho Application-Specific Password can be added to `server/.env` under `SMTP_PASS`. (In the meantime, simulated dev mode enables complete testing with zero friction).
