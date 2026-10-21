'use client';

import React from 'react';
import Link from 'next/link';
import { PRODUCTS } from '@/data/products';
import { getOptimizedImageUrl } from '@/lib/utils';
import styles from './SpecialProductsGrid.module.css';

export default function SpecialProductsGrid() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <span className="text-eyebrow">Featured from Sriram &amp; Co</span>
            <h2 className="heading-section">Special products</h2>
          </div>
        </div>

        <div className={styles.features}>
          {PRODUCTS.slice(0, 4).map((product, index) => (
            <article
              className={`${styles.feature} ${index % 2 === 1 ? styles.reversed : ''}`}
              key={product.id}
            >
              <Link
                href={index === 0 ? '/product/akari-8516sf' : `/product/${encodeURIComponent(product.slug || product.id)}`}
                className={styles.imageLink}
                aria-label={`View ${index === 0 ? 'AKARI 8516SF' : product.name}`}
              >
                <img
                  src={index === 0 ? '/fan-image.jpeg' : getOptimizedImageUrl(product.image, 900)}
                  alt={product.name}
                  className={styles.image}
                  loading="lazy"
                  decoding="async"
                  width={800}
                  height={600}
                />
              </Link>
              <p className={styles.description}>{product.fullDescription || product.shortDescription}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
