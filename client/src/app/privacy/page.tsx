import React from 'react';
import type { Metadata } from 'next';
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import styles from '@/app/legal.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy | Sri Ram & Co',
  description: 'Digital Personal Data Protection Act (DPDP) 2023 compliant privacy and data handling policy for Sri Ram & Co.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | Sri Ram & Co',
    description: 'Learn how your personal information is protected under Indian data privacy regulations.',
  },
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      currentSlug="privacy"
      title="Privacy & Data Protection Policy"
      subtitle="How Sri Ram & Co protects, processes, and safeguards customer personal data as a responsible Data Fiduciary."
      effectiveDate="October 14, 2026"
      statuteBadge="Digital Personal Data Protection (DPDP) Act, 2023"
    >
      <section>
        <h2>1. Commitment to Data Privacy</h2>
        <p>
          Sri Ram &amp; Co acts as a dedicated <strong>Data Fiduciary</strong> under Section 2(i) of the 
          <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>. We believe your privacy is fundamental. 
          This policy details the exact personal data we collect, lawful purposes for processing, our security safeguards, 
          and your statutory rights to access, correct, or erase your data.
        </p>
      </section>

      <section>
        <h2>2. Itemized Personal Data We Collect</h2>
        <p>In accordance with statutory data minimization principles, we collect only data strictly necessary to fulfill retail services:</p>
        <ul>
          <li><strong>Identity &amp; Contact:</strong> Full name, mobile telephone number, and optional email address (used for electronic GST invoices, dispatch OTPs, and delivery coordination).</li>
          <li><strong>Delivery Address:</strong> Street address, locality, landmark, city, and 6-digit postal PIN code.</li>
          <li><strong>Authentication Credentials:</strong> Securely hashed passwords or Google OAuth identifiers (managed via Firebase Authentication).</li>
          <li><strong>Order History:</strong> Record of purchased appliances, warranty invoice numbers, and payment status records.</li>
          <li><strong>Technical Identifiers:</strong> IP address, device browser type, and server session tokens recorded for system integrity and fraud prevention.</li>
        </ul>
        <div className={styles.calloutBox}>
          <div className={styles.calloutTitle}>Zero Financial Credential Storage</div>
          <p className={styles.calloutText}>
            Sri Ram &amp; Co never collects, stores, or processes full credit card numbers, CVVs, or UPI PINs. All electronic transactions 
            are handled through RBI-authorized payment infrastructure or direct doorstep card terminals.
          </p>
        </div>
      </section>

      <section>
        <h2>3. Lawful Purposes of Data Processing (Section 6 DPDP Act)</h2>
        <p>Your personal information is processed exclusively for the following specified lawful purposes:</p>
        <ol>
          <li>Routing and completing physical delivery of appliances via our direct store dispatch staff or verified courier partners.</li>
          <li>Sending SMS or WhatsApp order confirmations, dispatch updates, and delivery verification OTPs.</li>
          <li>Generating official GST tax invoices required under Indian commercial and taxation laws.</li>
          <li>Facilitating after-sales warranty claims, technical inspections, and replacement swaps.</li>
          <li>Detecting, preventing, and investigating fraudulent transactions or malicious platform attacks.</li>
        </ol>
      </section>

      <section>
        <h2>4. Strict Anti-Data-Sale Guarantee</h2>
        <p>
          <strong>We never sell, rent, trade, or monetize customer personal data.</strong> Your mobile number, address, 
          and purchasing history are never shared with third-party advertisers, lead brokers, or marketing syndicates.
        </p>
      </section>

      <section>
        <h2>5. Data Retention &amp; Security Measures</h2>
        <p>
          <strong>Retention Duration:</strong> Data is retained strictly for the duration required to provide e-commerce services 
          and satisfy statutory tax record-keeping mandates under the Central Goods and Services Tax Act, 2017 (minimum 6 years for financial tax invoices).
        </p>
        <p>
          <strong>Technical Safeguards:</strong> All web traffic is encrypted using modern TLS 1.3 (HTTPS) protocols. 
          Database access is guarded by enterprise-grade role-based access control (RBAC), salted cryptographic hashing (bcrypt/argon2), 
          and automated rate limiting to prevent unauthorized data harvesting.
        </p>
      </section>

      <section>
        <h2>6. Your Statutory Rights as a Data Principal</h2>
        <p>Under Chapter III of the DPDP Act, 2023, you enjoy enforceable rights over your data:</p>
        <ul>
          <li><strong>Right to Access:</strong> Request a complete summary of personal data held about you by Sri Ram &amp; Co.</li>
          <li><strong>Right to Correction &amp; Erasure:</strong> Request the correction of inaccurate data or the deletion of your account (subject to statutory financial retention limits).</li>
          <li><strong>Right to Nominate:</strong> Nominate an individual to exercise data rights in the event of death or incapacity.</li>
          <li><strong>Right to Grievance Redressal:</strong> Submit a complaint directly to our Grievance Officer regarding any privacy concern.</li>
        </ul>
      </section>
    </LegalPageLayout>
  );
}
