'use client';

import React from 'react';
import styles from './SpecialProductsGrid.module.css';

const featuredProducts = [
  {
    name: 'AKARI 16-inch rechargeable fan',
    image: '/fan-image.jpeg',
    description:
      'Stay comfortable through power cuts with a rechargeable 16-inch fan featuring a built-in LED light, three speed settings, and AC/DC and solar charging support.',
  },
  {
    name: 'NEUTON solar-powered fan',
    image: '/image2.png',
    description:
      'Enjoy a refreshing breeze with this table fan and its portable solar panel, a practical choice for everyday use at home.',
  },
];

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
      </div>
      <div className={styles.features}>
        {featuredProducts.map((product, index) => (
          <article
            className={`${styles.feature} ${index % 2 === 1 ? styles.reverse : ''}`}
            key={product.name}
          >
            <div className={styles.imageLink}>
              <img
                src={product.image}
                alt={product.name}
                className={styles.image}
                loading="lazy"
                decoding="async"
                width={800}
                height={600}
              />
            </div>
            <div className={styles.copy}>
              <h3 className={styles.productName}>{product.name}</h3>
              <p className={styles.description}>{product.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
