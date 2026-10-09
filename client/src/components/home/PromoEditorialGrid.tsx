import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import styles from './PromoEditorialGrid.module.css';

export default function PromoEditorialGrid() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.bentoGrid}>
          {/* Cell 1: Text Block (Top-Left) */}
          <div className={`${styles.bentoCell} ${styles.textCell} ${styles.cellTopLeft}`}>
            <span className={styles.eyebrow}>BETTER LIVING</span>
            <h3 className={styles.title}>Everyday appliances, chosen well.</h3>
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
              src="./mop.jpeg"
              alt="Kitchen mixer appliance"
              className={styles.image}
              loading="lazy"
            />
          </div>

          {/* Cell 3: Image Block (Bottom-Left) */}
          <div className={`${styles.bentoCell} ${styles.imageCell} ${styles.cellBottomLeft}`}>
            <img
              src="./fan.jpeg"
              alt="Heavy duty cleaning appliance"
              className={styles.image}
              loading="lazy"
            />
          </div>

          {/* Cell 4: Text Block (Bottom-Right) */}
          <div className={`${styles.bentoCell} ${styles.textCell} ${styles.cellBottomRight}`}>
            <span className={styles.eyebrow}>HOME UPGRADES</span>
            <h3 className={styles.title}>Useful upgrades for a more comfortable home.</h3>
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
