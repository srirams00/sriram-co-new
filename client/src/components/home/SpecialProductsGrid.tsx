'use client';

import React from 'react';
import { PRODUCTS } from '@/data/products';
import ProductCard from '@/components/products/ProductCard';
import styles from './BestSellersGrid.module.css';

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

        <div className={styles.grid}>
          {PRODUCTS.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
