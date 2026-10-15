'use client';

import React, { useRef } from 'react';
import { ShieldCheck, Tag, Truck, Headphones } from 'lucide-react';
import { gsap, useGSAP, isReducedMotion } from '@/lib/gsap';
import styles from './TrustFeatures.module.css';

const FEATURES = [
  {
    icon: ShieldCheck,
    title: '100% Genuine',
    description: 'Backing our guarantee with manufacturer warranty.',
  },
  {
    icon: Tag,
    title: 'No hidden costs',
    description: 'Clear, transparent pricing you can trust.',
  },
  {
    icon: Truck,
    title: 'Easy delivery',
    description: 'Direct to your door across Tamil Nadu.',
  },
  {
    icon: Headphones,
    title: 'Local Support',
    description: 'Dedicated store team ready on phone or WhatsApp.',
  },
];

export default function TrustFeatures() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (isReducedMotion()) return;

      gsap.from(`.${styles.featureItem}`, {
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 0.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 92%',
          toggleActions: 'play none none none',
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} className={styles.section}>
      <div className={`container ${styles.featuresGrid}`}>
        {FEATURES.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className={styles.featureItem}>
              <div className={styles.iconCircle}>
                <Icon size={20} className={styles.icon} />
              </div>
              <div className={styles.textGroup}>
                <p className={styles.title}>{item.title}</p>
                <p className={styles.description}>{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
