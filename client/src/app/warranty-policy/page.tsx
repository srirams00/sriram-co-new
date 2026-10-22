import React from 'react';
import type { Metadata } from 'next';
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import styles from '@/app/legal.module.css';
import { ShieldCheck, Award, Wrench, CheckCircle2, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Warranty & Service Policy | Sri Ram & Co',
  description: 'Official 1-Year Comprehensive Warranty on all products, service guarantees, and grievance redressal for Sri Ram & Co.',
  alternates: {
    canonical: '/warranty-policy',
  },
  openGraph: {
    title: 'Warranty & Service Policy | Sri Ram & Co',
    description: 'Every product sold by Sri Ram & Co includes a full 1-year warranty backed by official GST tax invoices.',
  },
};

export default function WarrantyPolicyPage() {
  return (
    <LegalPageLayout
      currentSlug="warranty-policy"
      title="Warranty, Service & Guarantee Policy"
      subtitle="Universal 1-Year Comprehensive Warranty on all products, genuine parts guarantee, and statutory customer redressal."
      effectiveDate="October 14, 2026"
      statuteBadge="Consumer Protection (E-Commerce) Rules, 2020 & BIS Standards"
    >
      <section>
        <h2>1. Universal 1-Year Warranty on All Products</h2>
        <p>
          At <strong>Sri Ram &amp; Co</strong>, we take genuine pride in retailing durable, high-performance home appliances, 
          kitchen equipment, and power tools.
        </p>

        {/* Big 1-Year Warranty Banner Callout */}
        <div className={styles.calloutBox} style={{ borderLeftColor: '#18A957', padding: '24px 22px' }}>
          <div className={styles.calloutTitle} style={{ fontSize: '1.2rem', marginBottom: 8 }}>
            <Award size={24} style={{ color: '#18A957' }} />
            Official 1-Year (12 Months) Comprehensive Warranty
          </div>
          <p className={styles.calloutText} style={{ fontSize: '0.98rem' }}>
            <strong>Every single product purchased from Sri Ram &amp; Co carries an official 1-Year (12 Months) Warranty </strong> 
            starting from the date of physical delivery. Your Sri Ram &amp; Co GST tax invoice serves as legal proof of warranty commencement.
          </p>
        </div>

        <p>Our dual-tier warranty structure guarantees that you are protected from the moment of unboxing through the entire year:</p>

        <div className={styles.tableContainer}>
          <table className={styles.policyTable}>
            <thead>
              <tr>
                <th>Protection Tier</th>
                <th>Coverage Duration</th>
                <th>What It Covers</th>
                <th>How It Is Fulfilled</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Tier 1: Store Replacement Guarantee</strong></td>
                <td><strong>Initial 3 Days</strong> from delivery</td>
                <td>Dead-On-Arrival (DOA), transit cracks, missing accessories, or initial defects.</td>
                <td>Immediate 100% free store pickup &amp; replacement with a new sealed box.</td>
              </tr>
              <tr>
                <td><strong>Tier 2: 1-Year Comprehensive Warranty</strong></td>
                <td><strong>Full 12 Months</strong> from delivery date</td>
                <td>Internal motor failures, electrical shorts, pump breakdowns, and manufacturing defects.</td>
                <td>Free technician service, genuine spare parts, and store repair facilitation.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>2. Tier 1: Initial 3-Day Store Swap</h2>
        <p>
          If your appliance or tool fails to power on upon arrival or experiences any initial manufacturing defect, 
          simply inform Sri Ram &amp; Co <strong>within three (3) days of delivery</strong>.
        </p>
        <ul>
          <li>Our delivery fleet coordinates doorstep collection at <strong>zero cost</strong>.</li>
          <li>You receive a brand-new, factory-sealed replacement unit immediately following verification.</li>
        </ul>
      </section>

      <section>
        <h2>3. Tier 2: 1-Year Comprehensive Warranty (All Catalog Products)</h2>
        <p>
          Throughout the entire 1-year warranty period, all products are fully protected under warranty service:
        </p>
        <ol>
          <li>
            <strong>Universal Scope:</strong> Whether you purchased a robot vacuum, mixer grinder, heavy-duty cordless drill, 
            air fryer, mist fan, or lawn trimmer — <strong>all products qualify for the full 1-year warranty</strong>.
          </li>
          <li>
            <strong>100% Genuine Spare Parts:</strong> All repairs utilize original, OEM-certified replacement components to preserve 
            appliance performance and longevity.
          </li>
          <li>
            <strong>Store Service Facilitation:</strong> We maintain direct partnerships with brand service networks (Bosch, Philips, 
            Crompton, Karcher, etc.). If you ever have difficulty arranging a local technician visit, our store support team 
            handles scheduling on your behalf across Tamil Nadu.
          </li>
          <li>
            <strong>Hassle-Free Verification:</strong> No separate registration or warranty cards to mail. Presenting your 
            Sri Ram &amp; Co <strong>GST Tax Invoice</strong> or order number is sufficient to claim service.
          </li>
        </ol>
      </section>

      <section>
        <h2>4. What Is Covered vs. What Is Excluded</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, margin: '20px 0' }}>
          <div style={{ background: '#f4fbf6', border: '1px solid #c7ebd3', borderRadius: 10, padding: '18px 20px' }}>
            <h3 style={{ color: '#174A2B', marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={18} style={{ color: '#18A957' }} />
              Covered Under 1-Year Warranty
            </h3>
            <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
              <li>Internal motor breakdown &amp; winding failures</li>
              <li>Electrical switch &amp; control board malfunctions</li>
              <li>Internal pump, gear, or heating element faults</li>
              <li>Defects in materials and original workmanship</li>
              <li>Factory assembly flaws arising during normal use</li>
            </ul>
          </div>

          <div style={{ background: '#fef7f7', border: '1px solid #fad2d2', borderRadius: 10, padding: '18px 20px' }}>
            <h3 style={{ color: '#b91c1c', marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} style={{ color: '#dc2626' }} />
              Not Covered (Exclusions)
            </h3>
            <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
              <li>Physical drops, impact breakage, or casing cracks</li>
              <li>Burnout caused by extreme electrical surges or missing earthing</li>
              <li>Cosmetic wear on consumables (drill bits, blades, carbon brushes)</li>
              <li>Tampering or opening by unauthorized third-party technicians</li>
              <li>Water ingress into non-waterproof housings</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2>5. How to Request Warranty Service</h2>
        <p>If you experience an issue with any product during your 1-year warranty period:</p>
        <ol>
          <li>Locate your Sri Ram &amp; Co GST Tax Invoice or Order Number (from your account or email).</li>
          <li>Email our support team at <strong>ramkumar@sriramandco.in</strong> or call/WhatsApp <strong>+91 93454 03136</strong>.</li>
          <li>Describe the issue; our technician will diagnose the fault and either arrange an in-home technician visit, a store service drop-off, or replacement parts.</li>
        </ol>
      </section>
    </LegalPageLayout>
  );
}
