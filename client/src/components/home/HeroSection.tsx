'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { gsap, useGSAP, isReducedMotion } from '@/lib/gsap';
import styles from './HeroSection.module.css';

export default function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const yearsCountRef = useRef<HTMLElement>(null);
  const homesCountRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (isReducedMotion()) return;

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      const yearsCount = { value: 0 };
      const homesCount = { value: 0 };

      tl.from(`.${styles.eyebrowBadge}`, {
        opacity: 0,
        y: 15,
        duration: 0.5,
      })
        .from(
          `.${styles.heroTitle}`,
          {
            opacity: 0,
            y: 25,
            duration: 0.7,
          },
          '-=0.3'
        )
        .from(
          `.${styles.heroSubtitle}`,
          {
            opacity: 0,
            y: 20,
            duration: 0.6,
          },
          '-=0.4'
        )
        .from(
          `.${styles.ctaWrapper}`,
          {
            opacity: 0,
            y: 20,
            duration: 0.5,
          },
          '-=0.3'
        )
        .from(
          `.${styles.metricItem}`,
          {
            opacity: 0,
            y: 15,
            stagger: 0.1,
            duration: 0.4,
          },
          '-=0.2'
        )
        .to(
          yearsCount,
          {
            value: 20,
            duration: 1.6,
            ease: 'power1.out',
            onUpdate: () => {
              if (yearsCountRef.current) {
                yearsCountRef.current.textContent = `${Math.round(yearsCount.value)}+`;
              }
            },
          },
          '<'
        )
        .to(
          homesCount,
          {
            value: 25000,
            duration: 1.8,
            ease: 'power1.out',
            onUpdate: () => {
              if (homesCountRef.current) {
                homesCountRef.current.textContent = `${Math.round(homesCount.value).toLocaleString('en-IN')}+`;
              }
            },
          },
          '<'
        )
        .from(
          `.${styles.imageBackdrop}`,
          {
            opacity: 0,
            scale: 0.95,
            duration: 0.8,
            ease: 'power2.out',
          },
          '-=0.6'
        )
        .from(
          `.${styles.floatingBadge}`,
          {
            opacity: 0,
            y: 15,
            duration: 0.5,
          },
          '-=0.3'
        );
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} className={styles.heroSection}>
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
              Our 20-year story
            </Link>
          </div>

          <div className={styles.trustMetrics}>
            <div className={styles.metricItem}>
              <strong ref={yearsCountRef} aria-label="20 plus">20+</strong>
              <span>Years of trust</span>
            </div>
            <div className={styles.metricDivider} />
            <div className={styles.metricItem}>
              <strong ref={homesCountRef} aria-label="25,000 plus">25,000+</strong>
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
            <Image
              src="/logo.webp"
              alt="Sri Ram & Co Home Kitchen Appliances"
              width={853}
              height={766}
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 550px"
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
