import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Scale, FileText, Calendar, Building2, User, Mail, Phone, MapPin } from 'lucide-react';
import styles from '@/app/legal.module.css';

interface LegalPageLayoutProps {
  currentSlug: 'terms' | 'privacy' | 'refund-policy' | 'shipping-policy' | 'warranty-policy';
  title: string;
  subtitle: string;
  effectiveDate?: string;
  statuteBadge: string;
  children: React.ReactNode;
}

const NAV_LINKS = [
  { slug: 'terms', label: 'Terms of Service', href: '/terms' },
  { slug: 'privacy', label: 'Privacy Policy', href: '/privacy' },
  { slug: 'refund-policy', label: 'Returns & Refunds', href: '/refund-policy' },
  { slug: 'shipping-policy', label: 'Shipping & Delivery', href: '/shipping-policy' },
  { slug: 'warranty-policy', label: '1-Year Warranty', href: '/warranty-policy' },
];

export default function LegalPageLayout({
  currentSlug,
  title,
  subtitle,
  effectiveDate = 'October 14, 2026',
  statuteBadge,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className={styles.legalWrapper}>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/" className={styles.breadcrumbLink}>Home</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbLink}>Legal</span>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbCurrent}>{title}</span>
        </nav>

        {/* Header Hero Banner */}
        <header className={styles.legalHeader}>
          <div className={styles.badgeRow}>
            <span className={styles.statuteBadge}>
              <Scale size={13} />
              {statuteBadge}
            </span>
            <span className={styles.verifiedBadge}>
              <ShieldCheck size={13} />
              Registered GST Retailer
            </span>
          </div>

          <h1 className={styles.pageTitle}>{title}</h1>
          <p className={styles.pageSubtitle}>{subtitle}</p>

          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <Calendar size={14} />
              <span>Effective Date: {effectiveDate}</span>
            </div>
            <div className={styles.metaItem}>
              <Building2 size={14} />
              <span>Sri Ram &amp; Co (Trichy &amp; Chennai)</span>
            </div>
            <div className={styles.metaItem}>
              <FileText size={14} />
              <span>Official Policy Document</span>
            </div>
          </div>
        </header>

        {/* Quick Nav Bar */}
        <nav className={styles.quickNav} aria-label="Legal Documents Navigation">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.slug}
              href={item.href}
              className={`${styles.quickNavLink} ${currentSlug === item.slug ? styles.quickNavActive : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Paper Document Container */}
        <main className={styles.paperCard}>
          {children}

          {/* Statutory Grievance Redressal Card */}
          <div className={styles.grievanceCard}>
            <h3 className={styles.grievanceTitle}>
              <ShieldCheck size={20} />
              Statutory Grievance Redressal Mechanism
            </h3>
            <p className={styles.grievanceSub}>
              In accordance with Rule 4(4) of the Consumer Protection (E-Commerce) Rules, 2020, Sri Ram &amp; Co has appointed a designated Grievance Officer:
            </p>

            <div className={styles.grievanceGrid}>
              <div className={styles.grievanceItem}>
                <div className={styles.grievanceLabel}>Grievance Officer</div>
                <div className={styles.grievanceValue}>
                  <User size={14} style={{ display: 'inline', marginRight: 4 }} />
                  S. Ramkumar
                </div>
              </div>
              <div className={styles.grievanceItem}>
                <div className={styles.grievanceLabel}>Contact Email</div>
                <div className={styles.grievanceValue}>
                  <Mail size={14} style={{ display: 'inline', marginRight: 4 }} />
                  <a href="mailto:support@sriramandco.com" style={{ color: 'inherit' }}>
                    support@sriramandco.com
                  </a>
                </div>
              </div>
              <div className={styles.grievanceItem}>
                <div className={styles.grievanceLabel}>Store Support Phone</div>
                <div className={styles.grievanceValue}>
                  <Phone size={14} style={{ display: 'inline', marginRight: 4 }} />
                  +91 93454 03136
                </div>
              </div>
              <div className={styles.grievanceItem}>
                <div className={styles.grievanceLabel}>Official Address</div>
                <div className={styles.grievanceValue} style={{ fontSize: '0.8rem', lineHeight: 1.3 }}>
                  <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
                  No. 11 Vinola Complex, Trichy &amp; Kothaval Chavadi St, Chennai, TN
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 12 }}>
              • Grievances acknowledged within 48 hours • Resolved within 1 month per statutory requirements.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
