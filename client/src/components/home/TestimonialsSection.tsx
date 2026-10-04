import React from 'react';
import { Star } from 'lucide-react';
import { Testimonial } from '@/types/testimonial';
import styles from './TestimonialsSection.module.css';

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export default function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const featured = testimonials[0];
  const others = testimonials.slice(1);

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <h2 className="heading-section">What our customers say</h2>
        </div>

        <div className={styles.grid}>
          {/* Featured Large Testimonial */}
          {featured && (
            <div className={styles.featuredCard}>
              <div className={styles.ratingRow}>
                {[...Array(featured.rating || 5)].map((_, i) => (
                  <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <p className={styles.featuredQuote}>{featured.quote}</p>
              <div className={styles.authorGroup}>
                <strong className={styles.authorName}>{featured.author}</strong>
                <span className={styles.authorMeta}>
                  {featured.location} • {featured.customerType}
                </span>
              </div>
            </div>
          )}

          {/* Secondary Testimonials Column */}
          <div className={styles.sideColumn}>
            {others.map((item) => (
              <div key={item.id} className={styles.secondaryCard}>
                <div className={styles.ratingRow}>
                  {[...Array(item.rating || 5)].map((_, i) => (
                    <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <p className={styles.secondaryQuote}>{item.quote}</p>
                <div className={styles.authorGroup}>
                  <strong className={styles.authorName}>{item.author}</strong>
                  <span className={styles.authorMeta}>
                    {item.location} • {item.customerType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
