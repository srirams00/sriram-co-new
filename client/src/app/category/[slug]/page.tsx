import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import styles from './category.module.css';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  
  // Parallel concurrent fetch to avoid network waterfall
  const [category, products] = await Promise.all([
    api.getCategoryBySlug(slug),
    api.getProducts({ category: slug }),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <div className={styles.categoryPage}>
      {/* Category Header */}
      <div className={styles.banner}>
        <div className="container">
          <Link href="/shop" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Back to All Products</span>
          </Link>
          <span className="text-eyebrow">Category Collection</span>
          <h1 className="heading-section">{category.name}</h1>
          <p className={styles.bannerDesc}>{category.description}</p>
        </div>
      </div>

      <div className="container">
        <div className={styles.resultsInfo}>
          <span>Showing <strong>{products.length}</strong> items in {category.name}</span>
        </div>

        {products.length > 0 ? (
          <div className={styles.grid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>No products currently found in this category.</p>
            <Link href="/shop" className="btn btn-primary">
              View All Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
