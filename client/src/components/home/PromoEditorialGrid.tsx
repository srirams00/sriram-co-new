'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { gsap, useGSAP, isReducedMotion } from '@/lib/gsap';
import styles from './PromoEditorialGrid.module.css';

export default function PromoEditorialGrid() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (isReducedMotion()) return;

      gsap.from(`.${styles.bentoCell}`, {
        opacity: 0,
        y: 25,
        stagger: 0.12,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className="container">
        <div className={styles.bentoGrid}>
          {/* Cell 1: Text Block (Top-Left) */}
          <div className={`${styles.bentoCell} ${styles.textCell} ${styles.cellTopLeft}`}>
            <span className={styles.eyebrow}>BETTER LIVING</span>
            <h2 className={styles.title}>Everyday appliances, chosen well.</h2>
            <p className={styles.paragraph}>
              Practical products for real life homes. Built with honest materials, efficient motors, and engineered for everyday comfort.
            </p>
            <Link href="/category/kitchen-essentials" className={`btn btn-primary ${styles.ctaBtn}`}>
              <span>Buy now</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Cell 2: Image Block (Top-Right) */}
          <div className={`${styles.bentoCell} ${styles.imageCell} ${styles.cellTopRight}`}>
            <img
              src="/image1.jpeg"
              alt="Kitchen mixer appliance"
              className={styles.image}
              loading="lazy"
              decoding="async"
              width={540}
              height={540}
            />
          </div>

          {/* Cell 3: Image Block (Bottom-Left) */}
          <div className={`${styles.bentoCell} ${styles.imageCell} ${styles.cellBottomLeft}`}>
            <img
              src="/image2.png"
              alt="Heavy duty cleaning appliance"
              className={styles.image}
              loading="lazy"
              decoding="async"
              width={540}
              height={540}
            />
          </div>

          {/* Cell 4: Text Block (Bottom-Right) */}
          <div className={`${styles.bentoCell} ${styles.textCell} ${styles.cellBottomRight}`}>
            <span className={styles.eyebrow}>HOME UPGRADES</span>
            <h2 className={styles.title}>Useful upgrades for a more comfortable home.</h2>
            <p className={styles.paragraph}>
              Durable gear for routine maintenance, deep cleaning, and garden care. Backed by direct store warranty and genuine spare parts.
            </p>
            <Link href="/category/cleaning-appliances" className={`btn btn-primary ${styles.ctaBtn}`}>
              <span>Explore</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
