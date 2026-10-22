import type { Metadata } from 'next';
import CategoryGrid from '@/components/home/CategoryGrid';
import { api } from '@/lib/api';
import styles from './categories.module.css';

export const metadata: Metadata = {
  title: 'Shop by Category | Sri Ram & Co',
  description: 'Browse appliances, kitchen essentials, power tools, garden equipment, and personal care products by category.',
};

export default async function CategoriesPage() {
  const categories = await api.getCategories();

  return (
    <main className={styles.page}>
      <header className={styles.banner}>
        <div className="container">
          <span className="text-eyebrow">Find what fits your needs</span>
          <h1 className="heading-section">Shop by category</h1>
          <p className={styles.description}>
            Browse our collection by category to find the right products for your home and work.
          </p>
        </div>
      </header>
      <div className="container">
        <CategoryGrid categories={categories} showViewAll={false} />
      </div>
    </main>
  );
}
