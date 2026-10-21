'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { STORES } from '@/data/stores';
import styles from './LazyHomeSection.module.css';

type HomeSection =
  | 'specialProducts'
  | 'categories'
  | 'bestSellers'
  | 'testimonials'
  | 'howItWorks'
  | 'stores'
  | 'contact';

const sectionLabels: Record<HomeSection, string> = {
  specialProducts: 'Special products',
  categories: 'Shop by category',
  bestSellers: 'Best sellers',
  testimonials: 'Customer testimonials',
  howItWorks: 'How ordering works',
  stores: 'Store locations',
  contact: 'Contact our store',
};

async function loadSection(section: HomeSection): Promise<ReactNode> {
  switch (section) {
    case 'specialProducts': {
      const { default: SpecialProductsGrid } = await import('./SpecialProductsGrid');
      return <SpecialProductsGrid />;
    }
    case 'categories': {
      const [{ api }, { default: CategoryGrid }] = await Promise.all([
        import('@/lib/api'),
        import('./CategoryGrid'),
      ]);
      return <CategoryGrid categories={await api.getCategories()} />;
    }
    case 'bestSellers': {
      const [{ api }, { default: BestSellersGrid }] = await Promise.all([
        import('@/lib/api'),
        import('./BestSellersGrid'),
      ]);
      return <BestSellersGrid products={await api.getBestSellers()} />;
    }
    case 'testimonials': {
      const [{ api }, { default: TestimonialsSection }] = await Promise.all([
        import('@/lib/api'),
        import('./TestimonialsSection'),
      ]);
      return <TestimonialsSection testimonials={await api.getTestimonials()} />;
    }
    case 'howItWorks': {
      const { default: HowItWorks } = await import('./HowItWorks');
      return <HowItWorks />;
    }
    case 'stores': {
      const { default: StoreLocationsSection } = await import('./StoreLocationsSection');
      return <StoreLocationsSection stores={STORES} />;
    }
    case 'contact': {
      const { default: ContactCtaBar } = await import('./ContactCtaBar');
      return <ContactCtaBar />;
    }
  }
}

export default function LazyHomeSection({ section }: { section: HomeSection }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [content, setContent] = useState<ReactNode>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (shouldLoad) return;

    const element = sectionRef.current;
    if (!element) return;

    if (!('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '250px 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [shouldLoad]);

  useEffect(() => {
    if (!shouldLoad) return;

    let cancelled = false;
    setError(null);

    loadSection(section)
      .then((loadedContent) => {
        if (!cancelled) setContent(loadedContent);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'An unexpected error occurred.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [retryCount, section, shouldLoad]);

  if (content) return content;

  return (
    <section
      ref={sectionRef}
      className={`${styles.placeholder} ${styles[section]}`}
      aria-label={sectionLabels[section]}
      aria-busy={!error}
    >
      {error ? (
        <div className={styles.error}>
          <p>Could not load {sectionLabels[section].toLowerCase()}: {error}</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="container" role="status" aria-live="polite">
          <span className={styles.heading} />
          <div className={styles.cards}>
            {Array.from({ length: section === 'categories' ? 5 : 4 }, (_, index) => (
              <div key={index} className={styles.card}>
                <span className={styles.image} />
                <span className={styles.line} />
                <span className={`${styles.line} ${styles.shortLine}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
