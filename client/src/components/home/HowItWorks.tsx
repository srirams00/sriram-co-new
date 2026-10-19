'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { getWhatsAppUrl } from '@/lib/utils';
import { gsap, useGSAP, isReducedMotion } from '@/lib/gsap';
import styles from './HowItWorks.module.css';

const STEPS = [
  {
    step: '01',
    title: 'Choose your products',
    description: 'Browse the catalog, select what you need, and add it to your basket.',
  },
  {
    step: '02',
    title: 'Pay securely online',
    description: 'Complete your payment online by UPI, card, or NetBanking to place your order.',
  },
  {
    step: '03',
    title: 'We pack and ship your order',
    description: 'Once we receive your order, our team carefully packs your products and sends them to you.',
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const whatsappUrl = getWhatsAppUrl('919443212345', 'Hello Sriram & Co, I have a question about placing an order.');

  useGSAP(
    () => {
      if (isReducedMotion()) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });

      tl.from(`.${styles.header}`, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: 'power2.out',
      }).from(
        `.${styles.stepCard}`,
        {
          opacity: 0,
          y: 25,
          stagger: 0.1,
          duration: 0.5,
          ease: 'power2.out',
        },
        '-=0.2'
      );
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <h2 className="heading-section">How ordering works</h2>
          <p className={styles.subtitle}>
            Choose the products you need and pay online. Once your order comes through, we pack it carefully and ship it to you.
          </p>
        </div>

        <div className={styles.stepsGrid}>
          {STEPS.map((item, idx) => (
            <div key={idx} className={styles.stepCard}>
              <div className={styles.stepNumberBadge}>{item.step}</div>
              <h3 className={styles.stepTitle}>{item.title}</h3>
              <p className={styles.stepDescription}>{item.description}</p>
            </div>
          ))}
        </div>

        <div className={styles.footerNote}>
          <span>Have an unusual item in mind? </span>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.whatsappLink}>
            WhatsApp our store team directly →
          </a>
        </div>
      </div>
    </section>
  );
}
