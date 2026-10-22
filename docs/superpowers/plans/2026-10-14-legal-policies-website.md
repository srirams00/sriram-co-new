# Implementation Plan: Legal Policies Storefront Integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

---

## 1. Goal Description
The objective is to implement and publish all 5 comprehensive, Indian statutory-compliant legal policies across dedicated public routes on the Sri Ram & Co e-commerce storefront:
1. `/terms` — **Terms of Service & Conditions of Sale**
2. `/privacy` — **Privacy & Data Protection Policy** (DPDP Act 2023)
3. `/refund-policy` — **Return, Replacement & Refund Policy** (3 days notice, 5-7 days refund timeline)
4. `/shipping-policy` — **Shipping & Delivery Policy** (Trichy & Chennai dispatch, SLA matrix, Click & Collect)
5. `/warranty-policy` — **Warranty, Guarantee & Grievance Redressal Policy** (Universal 1-Year Warranty on ALL products)

---

## 2. Updated Business Rules
- **Warranty Policy (`/warranty-policy`)**: **ALL products** in the catalog carry an official **1-Year (12 Months) Warranty** starting from the delivery date, backed by the GST tax invoice.
- **Return Notification Window (`/refund-policy`)**: Customers must inform Sri Ram & Co **within 3 days** of receiving their order for any DOA, transit damage, or defect.
- **Refund Processing SLA (`/refund-policy`)**: Approved refunds are credited back to the customer's account/payment card within **5 to 7 business days**.

---

## 3. Proposed Changes
- [NEW] `client/src/app/legal.module.css`
- [NEW] `client/src/components/legal/LegalPageLayout.tsx`
- [NEW] `client/src/app/terms/page.tsx`
- [NEW] `client/src/app/privacy/page.tsx`
- [NEW] `client/src/app/refund-policy/page.tsx`
- [NEW] `client/src/app/shipping-policy/page.tsx`
- [NEW] `client/src/app/warranty-policy/page.tsx`
- [MODIFY] `client/src/components/layout/Footer.tsx`

---

## 4. Verification Plan
- Build check: `npm run build:client` (all 5 routes static and 0 type errors).
- Browser visual inspection on `http://localhost:3000` via Playwright.
