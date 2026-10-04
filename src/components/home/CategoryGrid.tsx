import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Category } from '@/types/product';
import styles from './CategoryGrid.module.css';

interface CategoryGridProps {
  categories: Category[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section id="categories" className={styles.section}>
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
                  src={cat.image}
                  alt={cat.name}
                  className={styles.image}
                  loading="lazy"
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
