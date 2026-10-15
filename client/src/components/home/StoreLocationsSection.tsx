'use client';

import React, { useRef } from 'react';
import { MapPin, Phone, Clock, ExternalLink } from 'lucide-react';
import { StoreLocation } from '@/types/store';
import { gsap, useGSAP, isReducedMotion } from '@/lib/gsap';
import styles from './StoreLocationsSection.module.css';

interface StoreLocationsSectionProps {
  stores: StoreLocation[];
}

export default function StoreLocationsSection({ stores }: StoreLocationsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

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
        `.${styles.storeCard}`,
        {
          opacity: 0,
          y: 25,
          stagger: 0.12,
          duration: 0.6,
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
          <h2 className="heading-section">Visit our stores</h2>
          <p className={styles.subtitle}>
            Come see the products in person, get hands-on demonstrations, or pick up your order directly.
          </p>
        </div>

        <div className={styles.grid}>
          {stores.map((store) => (
            <div key={store.id} className={styles.storeCard}>
              <div className={styles.cardHeader}>
                <span className={styles.eyebrow}>
                  {store.isMainStore ? 'Main Retail Store' : 'Experience Store'}
                </span>
                <h3 className={styles.cityTitle}>{store.city}</h3>
              </div>

              <div className={styles.detailsList}>
                <div className={styles.detailRow}>
                  <MapPin size={17} className={styles.icon} />
                  <div>
                    <p className={styles.addressText}>{store.address}</p>
                    <p className={styles.landmarkText}>{store.landmark}</p>
                  </div>
                </div>

                <div className={styles.detailRow}>
                  <Phone size={17} className={styles.icon} />
                  <a href={`tel:${store.phone}`} className={styles.phoneLink}>
                    {store.phone}
                  </a>
                </div>

                <div className={styles.detailRow}>
                  <Clock size={17} className={styles.icon} />
                  <span className={styles.hoursText}>{store.hours}</span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <a
                  href={store.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn btn-secondary ${styles.directionsBtn}`}
                >
                  <MapPin size={16} />
                  <span>Get directions</span>
                  <ExternalLink size={14} className={styles.extIcon} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
