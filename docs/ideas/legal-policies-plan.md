# Sri Ram & Co — E-Commerce Legal Policies Implementation Plan

## Problem Statement
How might we provide Sri Ram & Co with a legally binding, transparent, and compliant policy infrastructure that safeguards store operations (power tools safety, doorstep UPI collections, return processing) while building customer trust under Indian e-commerce statutory rules?

---

## Recommended Direction
Implement standard, canonical policy routes in Next.js tailored specifically to Sri Ram & Co's store dispatch, in-person payment, and manufacturer warranty operations:

1. **Terms of Service (`/terms`)**:
   - Order acceptance, pricing, GST billing, and store counter pickups.
   - Limitation of liability for industrial machinery and power tools misuse (safety compliance disclaimer).
   - Designated Grievance Officer details (Mandatory under Consumer Protection Rules 2020).

2. **Privacy Policy (`/privacy`)**:
   - Digital Personal Data Protection (DPDP) Act 2023 compliance.
   - Transparent disclosure of customer name, phone number, shipping address, and Firebase OAuth identifiers.
   - Retention and strict prohibition against sharing customer data with third-party advertisers.

3. **Cancellation, Return & Refund Policy (`/refund-policy`)**:
   - 7-day store replacement window for defective, damaged in transit, or Dead-On-Arrival (DOA) units.
   - Refund turnaround (5–7 working days for online/UPI reversals).
   - Specific non-returnable categories (opened consumables, items damaged through deliberate mishandling).

4. **Shipping & Delivery Policy (`/shipping-policy`)**:
   - Direct store delivery from Trichy & Chennai fulfillment branches.
   - Dispatch SLA: Same-day / Next-day store dispatch for core Tamil Nadu regions.
   - Physical parcel verification and signature upon doorstep handover.

5. **Warranty & Service Policy (`/warranty-policy`)**:
   - Dual-tier protection: Sri Ram & Co 7-day replacement guarantee vs. official Brand Manufacturer Warranty (Bosch, Philips, Crompton, etc.).
   - Process for utilizing manufacturer authorized service centers across Tamil Nadu with tax invoices.

---

## Key Assumptions & Validations
- [ ] Direct store dispatches cover Tamil Nadu with in-person UPI/Card verification.
- [ ] In-store replacement is valid for 7 days post-delivery; subsequent maintenance is serviced by authorized brand centers.
- [ ] Digital customer records collected at checkout are used exclusively for delivery fulfillment, SMS/WhatsApp updates, and GST invoicing.

---

## MVP Scope
1. **Shared Policy Template / Layout**:
   - Clean, readable typography layout with sticky navigation jump links (`client/src/components/legal/LegalPageLayout.tsx`).
2. **Dedicated Static Pages**:
   - `client/src/app/terms/page.tsx`
   - `client/src/app/privacy/page.tsx`
   - `client/src/app/refund-policy/page.tsx`
   - `client/src/app/shipping-policy/page.tsx`
   - `client/src/app/warranty-policy/page.tsx`
3. **Store Navigation Integration**:
   - Update `client/src/components/layout/Footer.tsx` with clickable Next.js links.
4. **Checkout Binding**:
   - Update `client/src/app/checkout/page.tsx` to include legal acknowledgement before placing an order.

---

## Not Doing (and Why)
- **Arbitrary 30-day "no-questions-asked" returns on heavy machinery / power tools**:
  - *Why*: High risk of project use and return abuse for heavy commercial tools. 7-day defect/transit-damage replacement protects store economics.
- **Third-party cookie consent banner overlays**:
  - *Why*: Storefront uses minimal analytics and zero third-party tracking/ad retargeting pixels; simple privacy policy disclosure is faster and less intrusive.

---

## Open Questions & Review Decisions
1. **Designated Grievance Officer details**:
   - Contact Person: Grievance Officer, Sri Ram & Co.
   - Email: `grievance@sriramandco.com` (or store support).
   - Address: No. 11, Vinola Complex, Trichy & Kothaval Chavadi St, Chennai.
