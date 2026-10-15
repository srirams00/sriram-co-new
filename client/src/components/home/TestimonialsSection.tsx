'use client';

import React, { useRef } from 'react';
import { Star } from 'lucide-react';
import { Testimonial } from '@/types/testimonial';
import { gsap, useGSAP, isReducedMotion } from '@/lib/gsap';
import styles from './TestimonialsSection.module.css';

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export default function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const featured = testimonials[0];
  const others = testimonials.slice(1);

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
      })
        .from(
          `.${styles.featuredCard}`,
          {
            opacity: 0,
            y: 25,
            duration: 0.6,
            ease: 'power2.out',
          },
          '-=0.2'
        )
        .from(
          `.${styles.secondaryCard}`,
          {
            opacity: 0,
            y: 20,
            stagger: 0.1,
            duration: 0.5,
            ease: 'power2.out',
          },
          '-=0.3'
        );
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className={styles.section}>
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
