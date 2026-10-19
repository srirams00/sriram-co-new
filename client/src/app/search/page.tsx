'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search as SearchIcon, ArrowLeft, Frown } from 'lucide-react';
import { Product } from '@/types/product';
import { api } from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import styles from './search.module.css';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    let isMounted = true;
    api.getProducts().then((data) => {
      if (isMounted) {
        setProducts(data);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const searchResults = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.toLowerCase().trim();
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q) ||
      p.features?.some(f => f.toLowerCase().includes(q))
    );
  }, [products, query]);

  return (
    <div className={styles.searchPage}>
      <div className={styles.searchHeader}>
        <div className="container">
          <Link href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '12px', textDecoration: 'none' }}>
            <ArrowLeft size={16} />
            <span>Back to Shop</span>
          </Link>
          <h1 className="heading-section">
            {query.trim() ? `Search results for "${query}"` : 'Search our Catalog'}
          </h1>
          <div className={styles.searchBarWrapper}>
            <SearchIcon size={18} className={styles.searchIcon} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search appliances, cookware, fans, tools..."
              className={styles.searchInput}
              aria-label="Search products"
            />
          </div>
        </div>
      </div>

      <div className="container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p>Searching product catalog...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <>
            <div className={styles.resultsMeta}>
              <span>Found <strong>{searchResults.length}</strong> {searchResults.length === 1 ? 'product' : 'products'}</span>
            </div>
            <div className={styles.resultsGrid}>
              {searchResults.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className={styles.noResults}>
            <div className={styles.noResultsIcon}>
              <Frown size={32} />
            </div>
            <h2>No matching products found</h2>
            <p>We couldn't find any products matching &ldquo;{query}&rdquo;.</p>
            <ul className={styles.suggestionsList}>
              <li>Check your spelling or try more general keywords (e.g. &ldquo;mop&rdquo;, &ldquo;juicer&rdquo;)</li>
              <li>Browse by product category instead</li>
              <li>WhatsApp our store team to ask if we stock it</li>
            </ul>
            <Link href="/shop" className="btn btn-primary">
              View All Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>Loading search...</div>}>
      <SearchResultsContent />
    </Suspense>
  );
}
