import React from 'react';
import Link from 'next/link';
import { getWhatsAppUrl } from '@/lib/utils';
import styles from './HowItWorks.module.css';

const STEPS = [
  {
    step: '01',
    title: 'Pick what you need',
    description: 'Add items to your basket, or browse catalog items right from your phone.',
  },
  {
    step: '02',
    title: 'We call to confirm',
    description: 'Someone from our store team will call to confirm product details and delivery timing.',
  },
  {
    step: '03',
    title: 'Delivered to your door',
    description: 'Direct local store dispatch. Safe packing and fast delivery within 24 to 48 hours.',
  },
  {
    step: '04',
    title: 'Pay the way you like',
    description: 'Pay by UPI or debit/credit card when your order arrives.',
  },
];

export default function HowItWorks() {
  const whatsappUrl = getWhatsAppUrl('919443212345', 'Hello Sriram & Co, I have a question about placing an order.');

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <h2 className="heading-section">How ordering works</h2>
          <p className={styles.subtitle}>
            Getting an item from us is straightforward and secure. No hidden charges, no delivery delays.
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
