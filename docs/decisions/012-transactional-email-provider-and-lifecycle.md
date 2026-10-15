# ADR-012: Transactional Email Architecture, Provider Selection, and Order Lifecycle Notifications

## Status
Accepted

## Date
2026-10-15

## Context
Sri Ram & Co operates an e-commerce platform with store branches in Trichy and Chennai, Tamil Nadu. Customer communication currently relies on on-screen checkout confirmations and WhatsApp contact links. As order volume grows, automated, reliable transactional emails are required to keep customers informed at key stages of the order lifecycle:
1. **Order Placed**: Immediate confirmation acknowledging receipt and advising that store staff will verify details.
2. **Order Confirmed**: Confirmed order status with expected delivery timeline and dispatch branch (Trichy/Chennai).
3. **Processing**: Items being inspected and packed at the store.
4. **Out for Delivery**: Local driver assigned with driver name, contact phone, and delivery window.
5. **Delivered**: Delivery complete, warranty retention guidelines, and invoice link.
6. **Cancelled**: Notification of cancellation by store or customer, stating reason and refund SLA (5–7 days for online payments).

The sender address is designated as **`ramkumar@sriramandco.in`** (managed by S. Ramkumar).

We must evaluate whether to use **Nodemailer**, **Brevo (Sendinblue)**, or **Resend**, determine the template rendering strategy, and establish how the admin dashboard interacts with email dispatches.

## Decision

### 1. Provider Evaluation & Selection: Unified Pluggable Architecture (Nodemailer Core + API Adapters)

| Evaluation Axis | Nodemailer (Direct SMTP) | Brevo (Sendinblue) | Resend | Selected Solution |
| :--- | :--- | :--- | :--- | :--- |
| **Sending Model** | Standard SMTP (Node.js native) | REST API & SMTP Relay | Modern REST API & React Email | **Nodemailer with multi-relay support & API fallback** |
| **Free Tier** | Unlimited (uses existing domain mail host) | 300 emails/day (9,000/mo) | 100 emails/day (3,000/mo) | **Configurable via `.env`** |
| **Sender Verification** | Uses existing Workspace / Zoho / cPanel credentials | Quick sender email verification | Requires full domain DNS (DKIM/SPF) | **Immediate readiness with `ramkumar@sriramandco.in`** |
| **Vendor Lock-in** | Zero | Low | Low | **Zero lock-in** |

**Adopted Decision**:
Implement a **unified email engine (`server/src/services/emailService.ts`)** utilizing **Nodemailer** connected directly to the confirmed **Zoho Mail** mailbox for `ramkumar@sriramandco.in`:
- **SMTP Host**: `smtppro.zoho.in` (port 465 SSL or 587 TLS)
- **Sender**: `"Sri Ram & Co" <ramkumar@sriramandco.in>`
- **Authentication**: `ramkumar@sriramandco.in` with a Zoho Application-Specific Password
- **Zero Cost / Native Domain**: Leverages existing Zoho Mail domain mailbox without any third-party subscription fees or domain transfer.
- **Fail-Safe Development Mode**: If SMTP credentials are not yet configured in `.env`, the email service logs the message structure, recipient, subject, and HTML preview to the console and returns `{ success: true, mode: 'simulated' }`. This ensures order placements and admin status updates never crash or block the user experience.

### 2. Email Design & HTML Generation
The user provided a design system with 6 transactional email templates featuring Sri Ram & Co's brand palette:
- Primary Green: `#147b3d`, WhatsApp: `#18a957`, Surface: `#f7faf7`, Border: `#dce8de`, Font: Poppins/Arial.
- Real store hours & addresses (No. 11, Vinola Complex, Trichy & Kothaval Chavadi Street, Chennai).
- Verified GSTIN (`33ARHPR6139B1ZX`) and support contacts (`+91 93454 03136`, `support@sriramandco.in`).

**Implementation**:
- **Backend Email Compiler**: A server-side HTML template generator (`server/src/services/emailTemplates.ts`) compiles dynamic order data (customer name, items, delivery address, order number, pricing, driver details) into clean, table-based, mobile-responsive HTML compatible with Outlook, Gmail, Apple Mail, and mobile email clients.
- **Frontend Email Studio (`/admin/emails`)**: An interactive preview page in the admin panel built using the provided React components. Store managers can preview all 6 transactional emails at both Desktop (600px) and Mobile (375px) widths, inspect merge tags, and trigger test emails.

### 3. Admin Panel Lifecycle Integration
- In `client/src/app/admin/orders/page.tsx`:
  - Changing an order status in the dropdown automatically sends the corresponding transactional email to the customer.
  - A "Send Email" action button is added to each order row and within the Order Details Modal to allow manual re-sending or on-demand dispatch.
  - When selecting `Out for Delivery`, a driver assignment prompt allows specifying the delivery person's name and phone number (defaulting to store driver Murugan, `+91 94431 27658`), which is dynamically injected into the email.
  - Visual status feedback (toast/badge) confirms email delivery status without page reloads.

## Alternatives Considered

### Alternative 1: Pure Resend REST API Only
- **Pros**: Clean developer ergonomics and official React email support.
- **Cons**: Strict DNS record validation required before custom domain sending works. If DNS propagation takes time, transactional emails fail in staging/production.
- **Rejected**: Too rigid for immediate deployment; having Nodemailer SMTP as baseline provides instant compatibility with any email provider.

### Alternative 2: Frontend-only Email Triggering (e.g. EmailJS)
- **Pros**: No server endpoints required.
- **Cons**: Exposes API secrets to client, cannot be triggered reliably by admin status changes or webhook events, and fails if customer closes browser too early.
- **Rejected**: Transactional order notifications must be executed securely and asynchronously on the backend.

## Consequences
- Customers receive instant, branded order status updates with tracking links and direct WhatsApp support.
- Zero risk of order disruption: email dispatch is decoupled and non-blocking (wrapped in try/catch with fallback logging).
- The store administrator can visually inspect all templates at any time via the admin preview tool.
- Supports any SMTP provider (Hostinger, Google, Zoho, Brevo) with a single `.env` configuration change.
