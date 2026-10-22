import React from 'react';
import type { Metadata } from 'next';
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import styles from '@/app/legal.module.css';
import { Clock, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Return & Refund Policy | Sri Ram & Co',
  description: 'Return, replacement, and refund policy for Sri Ram & Co: 3-day notification window and 5-7 days refund processing SLA.',
  alternates: {
    canonical: '/refund-policy',
  },
  openGraph: {
    title: 'Return & Refund Policy | Sri Ram & Co',
    description: 'Learn about our 3-day return notification process, 5-7 days refund timeline, and 1-year product warranty.',
  },
};

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      currentSlug="refund-policy"
      title="Return, Replacement & Refund Policy"
      subtitle="Clear, fair, and objective guidelines for order cancellations, 3-day return notification, and 5-7 day refund processing."
      effectiveDate="October 14, 2026"
      statuteBadge="Consumer Protection Act, 2019 & E-Commerce Rules, 2020"
    >
      <section>
        <h2>1. Commitment to Fair Trade &amp; Consumer Rights</h2>
        <p>
          At <strong>Sri Ram &amp; Co</strong>, we hold transparency and customer satisfaction as core values. 
          Under Section 2(46) of the <strong>Consumer Protection Act, 2019</strong>, our return, cancellation, and refund rules 
          are structured with clear objective criteria, free from arbitrary clauses or hidden penalty deductions.
        </p>

        {/* Highlight Callouts for the two core user rules */}
        <div className={styles.calloutBox} style={{ borderLeftColor: '#18A957' }}>
          <div className={styles.calloutTitle}>
            <Clock size={18} />
            3-Day Notification Window
          </div>
          <p className={styles.calloutText}>
            Customers should notify Sri Ram &amp; Co <strong>within three (3) days of delivery</strong> in the event of receiving
            a Dead-On-Arrival unit, transit breakage, missing accessories, or a defective product.
          </p>
        </div>

        <div className={styles.calloutBox} style={{ borderLeftColor: '#174A2B', backgroundColor: '#edf5ee' }}>
          <div className={styles.calloutTitle}>
            <RefreshCw size={18} />
            5 to 7 Business Days Refund Processing SLA
          </div>
          <p className={styles.calloutText}>
            Once the returned unit is inspected and approved at our Trichy or Chennai branch, approved refunds take 
            <strong> 5 to 7 business days</strong> to be credited back to your original payment method or bank account.
          </p>
        </div>
      </section>

      <section>
        <h2>2. Order Cancellation Prior to Dispatch</h2>
        <ul>
          <li>
            <strong>100% Free Cancellation:</strong> You may cancel any order anytime before our dispatch staff or delivery vehicle leaves our 
            Trichy or Chennai fulfillment hubs. You will receive a <strong>100% full refund with zero cancellation charges</strong> 
            (in compliance with Section 74 of the Indian Contract Act against penal damages).
          </li>
          <li>
            <strong>Cancellation While En Route:</strong> If cancellation is requested while our delivery driver is already en route, 
            you may decline acceptance at your doorstep; a full refund of product cost will be processed.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. 3-Day Return &amp; Replacement Criteria</h2>
        <p>
          To initiate a return or replacement, you must inform us <strong>within 3 days of receiving your order</strong>.
          The following situations qualify for immediate store collection and replacement:
        </p>
        <div className={styles.tableContainer}>
          <table className={styles.policyTable}>
            <thead>
              <tr>
                <th>Eligible Condition</th>
                <th>Description</th>
                <th>Store Resolution</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Dead-On-Arrival (DOA)</strong></td>
                <td>Appliance or motor fails to power on or operate upon unboxing.</td>
                <td>Free doorstep pickup &amp; replacement unit.</td>
              </tr>
              <tr>
                <td><strong>Transit Damage</strong></td>
                <td>Physical cracks, dented housing, or broken accessories from transit.</td>
                <td>Immediate swap at zero additional cost.</td>
              </tr>
              <tr>
                <td><strong>Mismatched SKU / Wrong Item</strong></td>
                <td>Received model or color differs from the product ordered.</td>
                <td>Correct product dispatched immediately.</td>
              </tr>
              <tr>
                <td><strong>Missing Parts</strong></td>
                <td>Original factory nozzles, cords, or accessories absent from box.</td>
                <td>Missing components dispatched or full box replaced.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>How to Initiate Your Request (Within 3 Days):</h3>
        <ol>
          <li>Send an email to <strong>ramkumar@sriramandco.in</strong> or WhatsApp our support line at <strong>+91 93454 03136</strong>.</li>
          <li>Provide your Order Number (e.g., <code>SRC-123456</code>), along with photos or a brief video displaying the issue and carton serial number.</li>
          <li>Our store dispatch team will arrange a doorstep inspection and exchange with zero reverse pickup fees.</li>
        </ol>
      </section>

      <section>
        <h2>4. Refund Processing &amp; Bank Timelines (5 to 7 Days SLA)</h2>
        <p>
          When a replacement is unavailable, or if the customer prefers a refund following return inspection:
        </p>
        <ul>
          <li><strong>Inspection Window:</strong> Returned units are inspected by our store technicians within 24–48 hours of arriving at our branch.</li>
          <li><strong>Refund Credit SLA:</strong> The refund takes <strong>5 to 7 business days</strong> to reflect in your account:
            <ul>
              <li><strong>UPI &amp; NetBanking Orders:</strong> Re-credited to the linked bank account within 5 to 7 business days.</li>
              <li><strong>Credit &amp; Debit Card Payments:</strong> Processed through the banking gateway and credited within 5 to 7 business days.</li>
              <li><strong>Doorstep Handheld POS / QR Payments:</strong> Refunded via verified UPI or direct NEFT transfer within 5 to 7 business days.</li>
            </ul>
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Non-Returnable Exceptions</h2>
        <p>A return cannot be accepted under the following circumstances:</p>
        <ul>
          <li>Consumable items (e.g., cutting blades, replacement filters, cleaning chemicals) whose factory tamper seals have been broken.</li>
          <li>Products exhibiting signs of deliberate damage, water ingress into non-waterproof housings, or external electrical surge burn.</li>
          <li>Items returned without their original manufacturer box, packaging foam, warranty card, and accessories.</li>
          <li>Requests initiated after the expiration of the 3-day notification window.</li>
        </ul>
      </section>

      <section>
        <h2>6. Beyond 3 Days: 1-Year Comprehensive Warranty</h2>
        <div className={styles.calloutBox}>
          <div className={styles.calloutTitle}>
            <ShieldCheck size={18} />
            Universal 1-Year Warranty Protection
          </div>
          <p className={styles.calloutText}>
            If an issue arises after the initial 3 days, your purchase is completely safeguarded under Sri Ram &amp; Co&apos;s
            <strong> 1-Year (12 Months) Comprehensive Warranty</strong>. We coordinate technician visits, genuine spare parts, 
            and repair services across Tamil Nadu at zero labor cost.
          </p>
        </div>
      </section>
    </LegalPageLayout>
  );
}
