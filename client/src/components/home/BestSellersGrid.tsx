import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Product } from '@/types/product';
import ProductCard from '@/components/products/ProductCard';
import styles from './BestSellersGrid.module.css';

interface BestSellersGridProps {
  products: Product[];
}

export default function BestSellersGrid({ products }: BestSellersGridProps) {
  return (
    <section className={styles.section}>
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
