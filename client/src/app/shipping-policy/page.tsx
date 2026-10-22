import React from 'react';
import type { Metadata } from 'next';
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import styles from '@/app/legal.module.css';
import { Truck, MapPin, Store, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy | Sri Ram & Co',
  description: 'Shipping and delivery timelines, service zones, and direct store fulfillment across Tamil Nadu for Sri Ram & Co.',
  alternates: {
    canonical: '/shipping-policy',
  },
  openGraph: {
    title: 'Shipping & Delivery Policy | Sri Ram & Co',
    description: 'Learn about our same-day Trichy & Chennai branch dispatch, Tamil Nadu delivery SLAs, and free shipping terms.',
  },
};

export default function ShippingPolicyPage() {
  return (
    <LegalPageLayout
      currentSlug="shipping-policy"
      title="Shipping & Delivery Policy"
      subtitle="Transparent shipping timelines, regional coverage zones, and reliable direct store fulfillment across Tamil Nadu."
      effectiveDate="October 14, 2026"
      statuteBadge="Consumer Protection (E-Commerce) Rules, 2020 & Sale of Goods Act, 1930"
    >
      <section>
        <h2>1. Direct Store Fulfillment Model</h2>
        <p>
          Unlike aggregators who outsource packing to distant third parties, <strong>Sri Ram &amp; Co</strong> ships 
          directly from our established brick-and-mortar retail hubs:
        </p>
        <ul>
          <li><strong>Trichy Main Branch:</strong> No. 11, Vinola Complex, Tiruchirappalli, Tamil Nadu</li>
          <li><strong>Chennai Experience Store:</strong> Kothaval Chavadi Street, Chennai, Tamil Nadu</li>
        </ul>
        <p>
          This dual-hub structure enables dedicated store staff to inspect every appliance, test power functions, 
          and pack heavy equipment securely before handover to our direct drivers or trusted regional courier partners.
        </p>
      </section>

      <section>
        <h2>2. Delivery Coverage Zones &amp; Estimated Timelines (SLAs)</h2>
        <p>
          We dispatch orders twice daily. Depending on your destination address, estimated delivery times are as follows:
        </p>

        <div className={styles.tableContainer}>
          <table className={styles.policyTable}>
            <thead>
              <tr>
                <th>Destination Region</th>
                <th>Fulfillment Hub</th>
                <th>Estimated Delivery SLA</th>
                <th>Dispatch Frequency</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Trichy Urban &amp; Suburban</strong></td>
                <td>Trichy Main Branch</td>
                <td><strong>Same-Day or Next-Day</strong></td>
                <td>Twice daily store fleet dispatch</td>
              </tr>
              <tr>
                <td><strong>Chennai Metropolitan Area</strong></td>
                <td>Chennai Experience Store</td>
                <td><strong>Same-Day or Next-Day</strong></td>
                <td>Daily scheduled store fleet</td>
              </tr>
              <tr>
                <td><strong>Core Tamil Nadu</strong> (Madurai, Coimbatore, Salem, Thanjavur, Dindigul, Tirunelveli)</td>
                <td>Trichy / Chennai Hubs</td>
                <td><strong>24 to 48 Hours</strong></td>
                <td>Daily surface express courier</td>
              </tr>
              <tr>
                <td><strong>Rest of South India</strong> (Karnataka, Kerala, Andhra Pradesh)</td>
                <td>Regional Cargo Partner</td>
                <td><strong>2 to 4 Business Days</strong></td>
                <td>Daily surface cargo dispatch</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>3. Shipping Charges &amp; Free Delivery Policy</h2>
        <ul>
          <li>
            <strong>Promotional Free Delivery:</strong> Standard domestic delivery is provided <strong>Free of Charge</strong> for promotional orders 
            across core Tamil Nadu delivery zones, as displayed in your checkout order summary.
          </li>
          <li>
            <strong>Heavy Commercial Machinery:</strong> Certain exceptionally heavy industrial equipment (e.g., high-tonnage pressure washers, 
            floor polishers) shipped outside municipal boundaries may carry nominal freight charges, transparently calculated before payment.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Store Counter Pickup</h2>
        <p>
          Prefer collecting your equipment personally? Contact our Trichy Main Branch or Chennai Experience Store to ask about arranging an in-person pickup.
        </p>
        <ol>
          <li>Our team will confirm pickup availability and the order process for your selected product.</li>
          <li>Our staff prepares, tests, and packs the product within 2–4 hours.</li>
          <li>You will receive an SMS and email notification with a pickup code when your package is ready at the counter.</li>
          <li>Packages are reserved at the counter for up to <strong>7 calendar days</strong>.</li>
        </ol>
      </section>

      <section>
        <h2>5. Package Handover &amp; Doorstep Verification</h2>
        <p>
          Our drivers encourage you to inspect the external tamper-evident tape and carton integrity before signing.
          For doorstep UPI or handheld card POS transactions, you may verify the outer carton condition before completing payment.
        </p>
        <div className={styles.calloutBox}>
          <div className={styles.calloutTitle}>
            <Clock size={18} />
            Remember: 3-Day Return Notice Window
          </div>
          <p className={styles.calloutText}>
            If you detect any hidden transit damage or component defect after unboxing, simply inform our store team 
            <strong> within 3 days</strong> for an immediate free exchange.
          </p>
        </div>
      </section>
    </LegalPageLayout>
  );
}
