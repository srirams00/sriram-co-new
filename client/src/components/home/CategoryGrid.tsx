'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Category } from '@/types/product';
import { getOptimizedImageUrl } from '@/lib/utils';
import { gsap, useGSAP, isReducedMotion } from '@/lib/gsap';
import styles from './CategoryGrid.module.css';

interface CategoryGridProps {
  categories: Category[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
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
        `.${styles.card}`,
        {
          opacity: 0,
          y: 25,
          stagger: 0.08,
          duration: 0.6,
          ease: 'power2.out',
        },
        '-=0.2'
      );
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} id="categories" className={styles.section}>
      <div className="container">
        {/* Section Header */}
        <div className={styles.header}>
          <div>
            <span className="text-eyebrow">Find what fits your home</span>
            <h2 className="heading-section">Shop by category</h2>
          </div>
          <Link href="/shop" className={styles.viewAllLink}>
            <span>View all</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className={styles.grid}>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className={styles.card}
            >
              <div className={styles.imageWrapper}>
                <span className={styles.countBadge}>{cat.itemCount}+</span>
                <img
                  src={getOptimizedImageUrl(cat.image, 400)}
                  alt={cat.name}
                  className={styles.image}
                  loading="lazy"
                  decoding="async"
                  width={320}
                  height={240}
                />
              </div>
              <div className={styles.info}>
                <h3 className={styles.name}>{cat.name}</h3>
                <p className={styles.desc}>{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
