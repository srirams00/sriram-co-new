# ADR-008: Privacy Policy & Data Protection (DPDP Act 2023 Compliance)

## Status
Accepted

## Date
2026-10-11

## Context
With the enactment of the **Digital Personal Data Protection (DPDP) Act, 2023** and landmark jurisprudence (*Justice K.S. Puttaswamy v. Union of India (2017)*), e-commerce entities in India acting as Data Fiduciaries must comply with strict notice-and-consent mandates, purpose limitation, and data minimization. Sri Ram & Co collects customer names, delivery addresses, telephone numbers, and Firebase OAuth identifiers.

## Decision
Implement a transparent Privacy Policy with strict statutory data safeguards:
1. **Itemized Data Collection Notice**:
   - Explicit disclosure of all collected personal data categories: Name, physical delivery address with PIN code, contact mobile number, optional email, and Firebase Auth UID.
2. **Specified Purpose Limitation (Section 5 & 6 DPDP Act)**:
   - Data is utilized exclusively for order fulfillment, delivery routing, payment verification, OTP notifications, and statutory GST record-keeping.
3. **Zero Third-Party Commercial Monetization**:
   - Strict contractual prohibition against selling, licensing, renting, or disclosing customer contact numbers or order histories to advertising networks or third-party telemarketers.
4. **Data Subject Rights & Withdrawal of Consent**:
   - Unconditional right of customers to request access to, correction of, or permanent deletion of their customer profile by contacting `grievance@sriramandco.in`.
5. **Security & Authentication Safeguards**:
   - Encryption in transit (TLS 1.3/HTTPS) and industry-standard tokenization via Google Firebase and hashed MongoDB stores.

## Alternatives Considered
- **Vague "Legitimate Interests" Data Sharing Template**:
  - *Rejected*: Incompatible with Sections 5 & 6 of the DPDP Act 2023, which requires unambiguous, explicit consent for specific processing purposes.

## Consequences
- Protects the business from hefty statutory non-compliance penalties under the DPDP Act 2023 while establishing consumer trust.
