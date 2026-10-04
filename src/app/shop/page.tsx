'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { PRODUCTS } from '@/data/products';
import { CATEGORIES } from '@/data/categories';
import ProductCard from '@/components/products/ProductCard';
import styles from './shop.module.css';

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialQuery = searchParams.get('q') || '';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState('featured');
  const [maxPrice, setMaxPrice] = useState(20000);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    let result = [...PRODUCTS];

    if (selectedCategory !== 'all') {
      result = result.filter(p => p.categorySlug === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q)
      );
    }

    result = result.filter(p => p.price <= maxPrice);

    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [selectedCategory, searchQuery, sortBy, maxPrice]);

  return (
    <div className={styles.shopPage}>
      {/* Header Banner */}
      <div className={styles.banner}>
        <div className="container">
          <span className="text-eyebrow">Genuine Store Catalog</span>
          <h1 className="heading-section">All Products</h1>
          <p className={styles.bannerSubtitle}>
            Appliances, tools, and essentials curated for durability, safety, and long service life.
          </p>
        </div>
      </div>

      <div className="container">
        {/* Controls Bar */}
        <div className={styles.controlsBar}>
          {/* Search Bar */}
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search products by name or feature..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Sort Selection */}
          <div className={styles.sortWrapper}>
            <ArrowUpDown size={16} className={styles.sortIcon} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="featured">Featured First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Main Grid Layout with Category Pills */}
        <div className={styles.categoryPills}>
          <button
            type="button"
            className={`${styles.pill} ${selectedCategory === 'all' ? styles.activePill : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Products ({PRODUCTS.length})
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`${styles.pill} ${selectedCategory === cat.slug ? styles.activePill : ''}`}
              onClick={() => setSelectedCategory(cat.slug)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Status info */}
        <div className={styles.resultsInfo}>
          <span>Showing <strong>{filteredProducts.length}</strong> products</span>
          {selectedCategory !== 'all' && (
            <button 
              type="button" 
              className={styles.resetFilter}
              onClick={() => setSelectedCategory('all')}
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className={styles.productGrid}>
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h3>No products found</h3>
            <p>Try searching for a different keyword or resetting your filters.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setMaxPrice(20000);
              }}
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>Loading catalog...</div>}>
      <ShopContent />
    </Suspense>
  );
}
