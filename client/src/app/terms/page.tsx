import React from 'react';
import type { Metadata } from 'next';
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import styles from '@/app/legal.module.css';

export const metadata: Metadata = {
  title: 'Terms of Service | Sri Ram & Co',
  description: 'Terms of Service, Conditions of Sale, and Indian statutory compliance framework for Sri Ram & Co.',
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    title: 'Terms of Service | Sri Ram & Co',
    description: 'Official conditions of sale, GST compliance, and user agreement for Sri Ram & Co.',
  },
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      currentSlug="terms"
      title="Terms of Service & Conditions of Sale"
      subtitle="Governing contract, purchase terms, and dispute framework in accordance with Indian e-commerce legislation."
      effectiveDate="October 14, 2026"
      statuteBadge="Indian Contract Act, 1872 & Consumer Protection Act, 2019"
    >
      <section>
        <h2>1. Applicability &amp; Acceptance of Terms</h2>
        <p>
          These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;Customer&quot;, &quot;User&quot;, &quot;You&quot;) 
          and <strong>Sri Ram &amp; Co</strong> (&quot;Store&quot;, &quot;We&quot;, &quot;Us&quot;), a registered GST merchant operating retail branches 
          in Tiruchirappalli (Trichy) and Chennai, Tamil Nadu.
        </p>
        <p>
          By accessing our official portal (<strong>https://sriramandco.in</strong>), placing an order for appliances, tools, or equipment, 
          or registering an account, you unconditionally accept and agree to comply with these Terms, along with our 
          Privacy Policy, Refund Policy, and Shipping Policy.
        </p>
        <p>These terms strictly adhere to the following statutory frameworks:</p>
        <ul>
          <li><strong>The Indian Contract Act, 1872</strong> (Formation and validity of commercial agreements)</li>
          <li><strong>The Consumer Protection Act, 2019</strong> &amp; <strong>Consumer Protection (E-Commerce) Rules, 2020</strong></li>
          <li><strong>The Information Technology Act, 2000</strong> &amp; Reasonable Security Practices Rules, 2011</li>
          <li><strong>The Sale of Goods Act, 1930</strong> (Transfer of property and merchantable quality standards)</li>
        </ul>
      </section>

      <section>
        <h2>2. Eligibility &amp; User Account Integrity</h2>
        <p>To enter into transactions or create an account with Sri Ram &amp; Co:</p>
        <ol>
          <li>You must be at least 18 years of age and competent to enter into a contract under Section 11 of the Indian Contract Act, 1872.</li>
          <li>You agree to provide true, current, and verifiable delivery, phone, and billing details during registration and checkout.</li>
          <li>You are responsible for maintaining the confidentiality of your login credentials and OTP codes. Sri Ram &amp; Co shall not be liable for unauthorized access resulting from user credential sharing.</li>
        </ol>
      </section>

      <section>
        <h2>3. Order Placement, Pricing &amp; GST Invoicing</h2>
        <p>
          <strong>Contract Formation:</strong> The display of items on our storefront represents an invitation to offer. 
          When you submit an order at checkout, this represents an offer to purchase. A binding contract of sale is formed 
          only when your order is confirmed and dispatched from our Trichy or Chennai fulfillment hubs.
        </p>
        <p>
          <strong>Pricing &amp; GST Transparency:</strong> All product prices displayed on the storefront are quoted in Indian Rupees (INR) 
          and are inclusive of applicable Goods and Services Tax (CGST and SGST). An official GST tax invoice accompanies every physical shipment 
          and is available electronically in your order account.
        </p>
        <div className={styles.calloutBox}>
          <div className={styles.calloutTitle}>Typographical Price Error Safeguard</div>
          <p className={styles.calloutText}>
            In the rare event of an inadvertent typographical error in displayed price, Sri Ram &amp; Co reserves the right to notify the customer 
            and cancel the order prior to dispatch with an immediate 100% refund.
          </p>
        </div>
      </section>

      <section>
        <h2>4. Doorstep Fulfillment &amp; Payment Methods</h2>
        <p>Sri Ram &amp; Co provides flexible and transparent payment mechanisms designed for customer convenience:</p>
        <ul>
          <li><strong>Doorstep UPI Payment:</strong> Scan the verified store UPI QR code presented by our store delivery driver upon package handover.</li>
          <li><strong>Doorstep Handheld Card POS:</strong> Pay securely using Debit or Credit cards via our portable store payment terminal.</li>
          <li><strong>Store Counter Pickup:</strong> Contact our Trichy Main Branch or Chennai Experience Store to ask about arranging an in-person pickup.</li>
        </ul>
      </section>

      <section>
        <h2>5. High-Voltage Tools &amp; Industrial Equipment Safety Disclaimer</h2>
        <p>
          Sri Ram &amp; Co retails heavy-duty power tools, high-pressure washers, commercial mixers, and workshop machinery 
          manufactured by authorized brand partners (Bosch, Philips, Crompton, etc.).
        </p>
        <ul>
          <li><strong>Operator Responsibility:</strong> All tools must be used in strict adherence to original manufacturer safety manuals, using proper protective gear (safety goggles, insulated gloves) and certified electrical supplies.</li>
          <li><strong>Limitation of Liability:</strong> Under the Sale of Goods Act 1930, Sri Ram &amp; Co shall not be held liable for secondary damages, business disruption, or bodily injury arising from equipment misuse, electrical phase imbalances, or failure to follow manufacturer safety precautions.</li>
        </ul>
      </section>

      <section>
        <h2>6. Dispute Resolution &amp; Jurisdiction</h2>
        <p>
          These Terms are governed by and construed in accordance with the substantive laws of the Republic of India. 
          Any dispute or claim arising out of transactions on this portal shall be subject to the exclusive jurisdiction 
          of the competent civil courts in <strong>Tiruchirappalli (Trichy) or Chennai, Tamil Nadu</strong>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
