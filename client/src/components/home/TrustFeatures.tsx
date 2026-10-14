import React from 'react';
import { ShieldCheck, Tag, Truck, Headphones } from 'lucide-react';
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
  return (
    <section className={styles.section}>
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
