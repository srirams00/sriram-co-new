# ADR-005: E-Commerce Legal Policies and Compliance Framework

## Status
Accepted

## Date
2026-10-10

## Context
Sri Ram & Co operates as an omnichannel retail and direct-store delivery e-commerce platform based in Trichy and Chennai, Tamil Nadu, India. The store offers physical household appliances, cleaning equipment, and power tools. Payments are collected via in-person door-step UPI QR scanning and handheld POS card terminals, alongside in-store counter pickups.

Under Indian jurisdiction, digital commerce entities must comply with:
1. **Consumer Protection (E-Commerce) Rules, 2020** (mandatory disclosure of return/refund policies, merchant details, warranty disclaimers, and statutory grievance officer contact).
2. **Digital Personal Data Protection (DPDP) Act, 2023** and **Information Technology Act, 2000** (data minimization, consent notice, privacy disclosures, authentication handling).
3. **Legal Metrology (Packaged Commodities) Rules** and **GST Act requirements** (tax invoices, pricing transparency).

Currently, the storefront displays plain-text footer items without navigable policy pages, and the checkout flow completes orders without explicit legal consent checkboxes.

## Decision
Establish a dedicated, accessible, and legally vetted policy architecture:
1. **Document-level Routes**:
   - `/terms`: Terms of Service (commercial contract, purchase terms, power tool misuse limitation of liability).
   - `/privacy`: Privacy Policy (DPDP compliance, Firebase Auth tokens, phone/delivery data usage).
   - `/refund-policy`: Return, Cancellation & Refund Policy (7-day Dead-On-Arrival store replacement, refund SLA).
   - `/shipping-policy`: Delivery & Store Dispatch Policy (Trichy/Chennai hubs, free delivery rules, recipient verification).
   - `/warranty-policy`: Warranty & Service Policy (store replacement vs. manufacturer warranty terms).
2. **Statutory Grievance Architecture**:
   - Embed statutory grievance officer and nodal officer contact directly in Terms & Conditions and Contact views.
3. **Checkout Binding**:
   - Embed active policy links and checkout consent disclaimer in the order review container of `/checkout`.
4. **Footer Navigation**:
   - Upgrade `client/src/components/layout/Footer.tsx` from static spans to Next.js `<Link>` components referencing the statutory policy routes.

## Alternatives Considered

### Alternative 1: Single monolithic `/legal` page with accordion sections
- **Pros**: Fewer routes to maintain.
- **Cons**: Poor SEO indexing, cumbersome to deep-link from checkout disclaimers, and worse accessibility.
- **Rejected**: Individual canonical URLs are standard for e-commerce compliance and audit clarity.

### Alternative 2: External Hosted Legal Hub (Termly / Iubenda)
- **Pros**: Auto-updating boilerplate.
- **Cons**: Third-party iframe or redirect breaks local branding, requires ongoing subscription, and misses custom store operations (doorstep UPI, Trichy/Chennai store dispatches, power tool liability).
- **Rejected**: In-repo Next.js pages provide fast SSR, zero external dependencies, and complete control over regional legal specifications.

## Consequences
- Full statutory compliance with Indian Consumer Protection (E-Commerce) Rules 2020 and DPDP Act 2023.
- Customers and payment operators (Razorpay/Stripe/UPI partners) have clear, transparent access to refund, shipping, and warranty SLAs.
- Liability protection against improper use of power tools and industrial equipment.
- Increased trust score for verified merchant status.
