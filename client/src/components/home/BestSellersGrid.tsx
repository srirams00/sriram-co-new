'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Product } from '@/types/product';
import ProductCard from '@/components/products/ProductCard';
import { gsap, useGSAP, isReducedMotion } from '@/lib/gsap';
import styles from './BestSellersGrid.module.css';

interface BestSellersGridProps {
  products: Product[];
}

export default function BestSellersGrid({ products }: BestSellersGridProps) {
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
        `.${styles.grid} > *`,
        {
          opacity: 0,
          y: 30,
          stagger: 0.1,
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
        {/* Section Header */}
        <div className={styles.header}>
          <div>
            <span className="text-eyebrow">Trusted by our customers</span>
            <h2 className="heading-section">Best sellers</h2>
          </div>
          <Link href="/shop" className={styles.viewAllLink}>
            <span>View all products</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Product Grid */}
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
