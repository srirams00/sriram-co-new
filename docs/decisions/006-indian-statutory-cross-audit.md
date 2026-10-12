# Cross-Audit: Sri Ram & Co E-Commerce Policies vs. Indian Statutes & Jurisprudence (Legallogy Audit)

## Executive Summary
This document cross-audits Sri Ram & Co's e-commerce policy framework against Indian statutory rules, Supreme Court benchmarks, and legal intelligence derived from **Legallogy** (`indianLawRules.ts`). 

Our goal is to ensure Sri Ram & Co's storefront policies (Terms of Service, Privacy Policy, Return & Refund Policy, Shipping Policy, and Warranty Policy) are legally defensible, eliminate predatory or void clauses, protect store operations against abusive claims, and fully comply with the **Consumer Protection (E-Commerce) Rules 2020**, **DPDP Act 2023**, and the **Indian Contract Act 1872**.

---

## 1. Statutory Cross-Check Matrix (Benchmarked against `indianLawRules.ts`)

| Indian Statute & Section | Landmark Precedent (Legallogy) | Statutory Rule & Legal Trap | Sri Ram & Co Policy Application & Fix |
| :--- | :--- | :--- | :--- |
| **Consumer Protection Act, 2019 — Section 2(46)** | *Pioneer Urban Land & Infrastructure v. Govindan Raghavan (2019)* | **Unfair Contract Terms**: Clauses that unilaterally bar refunds, impose unreasonable conditions on returns, or allow arbitrary cancellation without cause are declared unfair and void by Consumer Commissions. | **Return & Refund Policy**: Clearly define objective return criteria (7-day DOA/transit damage window) rather than arbitrary subjective refusal. Ensure refund turnaround (5–7 days) is explicitly guaranteed. |
| **DPDP Act, 2023 — Sections 5 & 6** | *Justice K.S. Puttaswamy v. Union of India (2017) 10 SCC 1* | **Notice & Consent Architecture**: Data fiduciaries must present clear, itemized notice of personal data collected, specific purpose, and an unconditional right to withdraw consent. | **Privacy Policy & Checkout**: Explicitly list collected data (name, phone, delivery address, Firebase token). Add consent notice above the checkout submit button with direct links to `/privacy`. |
| **Indian Contract Act, 1872 — Section 23** | *Central Inland Water Transport Corp v. Brojo Nath Ganguly (1986) 3 SCC 156* | **Unconscionable Terms against Public Policy**: Grossly one-sided standard-form contracts between parties of unequal bargaining power are unenforceable. | **Terms of Service**: Avoid total exclusion of all merchant liability. Provide balanced liability clauses: store replaces DOA/defective units; user adheres to manufacturer safety manuals for power tools. |
| **Indian Contract Act, 1872 — Section 28** | *Food Corporation of India v. New India Assurance Co. (1994)* | **Restraint of Legal Proceedings**: Restricting consumer dispute resolution to distant cities or unreasonably truncating statutory limitation periods (3 years under Limitation Act, 1963) is void. | **Dispute Resolution Clause**: Anchor jurisdiction in the local competent courts of **Tiruchirappalli (Trichy) / Chennai, Tamil Nadu**, with fast-track mediation, rather than foreign or oppressive dispute forums. |
| **Indian Contract Act, 1872 — Section 74** | *Kailash Nath Associates v. DDA (2015) 4 SCC 136; Fateh Chand (1964)* | **Liquidated Damages as Penalty**: Stipulated damages are penalty ceilings, not automatic windfalls. You cannot levy arbitrary forfeiture or cancellation fines without proving actual loss. | **Order Cancellation Policy**: When a customer cancels prior to store dispatch, 100% refund is processed with zero cancellation penalty. Transit deductions apply only if order is dispatched. |
| **Arbitration Act, 1996 — Section 12(5)** | *Perkins Eastman Architects DPC v. HSCC (India) Ltd. (2020) 20 SCC 760* | **Unilateral Arbitrator Appointment Void**: A party with an interest in the outcome cannot unilaterally name a sole arbitrator. | **Dispute Clause**: Ensure consumer disputes are handled via mutual consensus conciliation/mediation or statutory Consumer Disputes Redressal Commission (District Forum, Trichy/Chennai). |
| **Consumer Protection (E-Commerce) Rules, 2020 — Rule 4 & 5** | Statutory Notification G.S.R. 452(E) | **Mandatory Grievance Officer & Contact Disclosure**: Every e-commerce entity must display contact details of a designated Grievance Officer and acknowledge tickets within 48h. | **Terms & Footer**: Explicitly publish the Grievance Officer's name, email (`grievance@sriramandco.in`), phone, and physical store address with a 48h acknowledgement SLA. |

---

## 2. Key Insights for Sri Ram & Co's Five Core Legal Documents

### A. Terms of Service (`/terms`)
1. **Contractual Offer & Acceptance**: Placing an order constitutes an offer; acceptance occurs when the parcel is dispatched from our Trichy or Chennai branch.
2. **Pricing & GST**: All display prices include applicable CGST/SGST; official GST tax invoices accompany every physical delivery.
3. **Power Tools & Machinery Safety**: Clear disclaimer stating that power tools, heavy drills, and high-voltage appliances must be operated in accordance with OEM user safety guides. Liability for consequential damage due to improper power source or electrical surge is capped as permitted under the Sale of Goods Act, 1930.
4. **Governing Law & Jurisdiction**: Courts of Tiruchirappalli and Chennai, Tamil Nadu.

### B. Privacy Policy (`/privacy`)
1. **DPDP Act 2023 Alignment**: Clear itemized notice of data collected (Customer Full Name, Shipping Address, Mobile Number, Firebase Auth UID).
2. **Purpose Limitation**: Data is used strictly for delivery logistics, OTP notifications, order tracking, and statutory tax invoicing.
3. **Zero Third-Party Data Monetization**: Explicit guarantee that customer phone numbers and purchase history are never sold, rented, or shared with third-party advertising brokers.
4. **Data Subject Rights**: Right to access, correct, or request deletion of account records upon request to `grievance@sriramandco.in`.

### C. Return, Replacement & Refund Policy (`/refund-policy`)
1. **7-Day Dead-On-Arrival (DOA) / Transit Damage Window**: Defective or broken items reported within 7 days of doorstep delivery are replaced at no extra cost.
2. **Refund Turnaround (SLA)**: Once return parcel is received and inspected at the store hub, refunds are credited back to the source account (UPI / Bank / Card) within 5–7 business days.
3. **Non-Returnable Exceptions**: Consumable items (lubricants, drill bits subjected to wear), or products altered/repaired without authorization.

### D. Shipping & Store Delivery Policy (`/shipping-policy`)
1. **Fulfillment Centers**: Direct store delivery dispatch from Trichy (Vinola Complex) & Chennai (Kothaval Chavadi St) hubs.
2. **Delivery Timelines**: Same-day or next-day dispatch for Tamil Nadu orders; 2–4 business days for rest of South India.
3. **Verification on Delivery**: Delivery partners provide package inspection upon handover; door-step UPI payment confirmation.

### E. Warranty & Service Policy (`/warranty-policy`)
1. **Dual Protection Structure**:
   - **Store Replacement Guarantee (Days 1–7)**: Immediate store-level exchange for manufacturing defects.
   - **Brand Warranty (Post 7 Days)**: Covered under the respective manufacturer’s standard authorized warranty (Bosch, Philips, Crompton, etc.). Sri Ram & Co provides tax invoices and authorized service center facilitation.

---

## 3. Statutory Grievance Redressal Mechanism
Mandatory disclosure under Rule 4(4) of the Consumer Protection (E-Commerce) Rules, 2020:

- **Designated Grievance Officer**: S. Ramkumar
- **Company**: Sri Ram & Co
- **Email**: `grievance@sriramandco.in` / `support@sriramandco.in`
- **Helpdesk Phone**: +91 93454 03136 / 91713 14888
- **Address**: No. 11, Vinola Complex, Trichy & Kothaval Chavadi Street, Chennai, Tamil Nadu, India.
- **Ticket Acknowledgement Time**: Within 48 hours.
- **Redressal SLA**: Within 1 month from date of receipt.
