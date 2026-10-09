import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import styles from './HeroSection.module.css';

export default function HeroSection() {
  return (
    <section className={styles.heroSection}>
      <div className={`container ${styles.heroContainer}`}>
        {/* Left Column: Copy & Actions */}
        <div className={styles.heroContent}>
          <div className={styles.eyebrowBadge}>
            <ShieldCheck size={14} className={styles.eyebrowIcon} />
            <span>A better way to shop</span>
          </div>

          <h1 className={styles.heroTitle}>
            Good tools.<br />
            <span className={styles.heroTitleAccent}>Better living.</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Reliable appliances and daily essentials for your home. Chosen with care, tested for durability, and delivered directly to your door.
          </p>

          <div className={styles.ctaWrapper}>
            <Link href="/shop" className={`btn btn-primary btn-lg ${styles.heroBtn}`}>
              <span>Shop all products</span>
              <ArrowRight size={18} />
            </Link>

            <Link href="/about" className={`btn btn-secondary btn-lg ${styles.secondaryBtn}`}>
              Our 35-year story
            </Link>
          </div>

          <div className={styles.trustMetrics}>
            <div className={styles.metricItem}>
              <strong>35+</strong>
              <span>Years of trust</span>
            </div>
            <div className={styles.metricDivider} />
            <div className={styles.metricItem}>
              <strong>25,000+</strong>
              <span>Happy homes</span>
            </div>
            <div className={styles.metricDivider} />
            <div className={styles.metricItem}>
              <strong>2 Branches</strong>
              <span>Trichy &amp; Chennai</span>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Visual */}
        <div className={styles.heroVisual}>
          <div className={styles.imageBackdrop}>
            <img
              src=".\logo.png"
              alt="Modern home kitchen appliances"
              className={styles.heroImage}
            />
            {/* Floating Quality Badge */}
            <div className={styles.floatingBadge}>
              <div className={styles.floatingIcon}>✓</div>
              <div className={styles.floatingText}>
                <strong>100% Genuine</strong>
                <span>Official Warranty</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
