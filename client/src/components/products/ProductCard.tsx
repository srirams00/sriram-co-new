'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Star } from 'lucide-react';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatCurrency } from '@/lib/utils';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);

  return (
    <div className={styles.card}>
      {/* Image Container with Badges */}
      <div className={styles.imageContainer}>
        {product.badge && (
          <span className={styles.badge}>{product.badge}</span>
        )}

        <button
          type="button"
          className={`${styles.wishlistBtn} ${inWishlist ? styles.activeWishlist : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
        </button>

        <Link href={`/product/${product.slug}`} className={styles.imageLink}>
          <img
            src={product.image}
            alt={product.name}
            className={styles.image}
            loading="lazy"
          />
        </Link>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.categoryRow}>
          <span className={styles.category}>{product.category}</span>
          <div className={styles.rating}>
            <Star size={12} fill="#f59e0b" color="#f59e0b" />
            <span>{product.rating}</span>
          </div>
        </div>

        <Link href={`/product/${product.slug}`} className={styles.titleLink}>
          <h3 className={styles.title}>{product.name}</h3>
        </Link>

        <p className={styles.description}>{product.shortDescription}</p>

        {/* Pricing & CTA */}
        <div className={styles.footer}>
          <div className={styles.priceContainer}>
            <span className={styles.price}>{formatCurrency(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className={styles.originalPrice}>
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          <button
            type="button"
            className={`btn btn-primary ${styles.addBtn}`}
            onClick={() => addToCart(product, 1)}
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
