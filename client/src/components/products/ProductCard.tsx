'use client';

import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { formatCurrency, getOptimizedImageUrl, getEffectiveOriginalPrice } from '@/lib/utils';
import RatingStars from './RatingStars';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);

  const effectiveOriginalPrice = getEffectiveOriginalPrice(product.price, product.originalPrice);
  const discountPercent =
    effectiveOriginalPrice > product.price
      ? Math.round(((effectiveOriginalPrice - product.price) / effectiveOriginalPrice) * 100)
      : null;

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
          aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>

        <Link
          href={`/product/${product.slug}`}
          className={styles.imageLink}
          aria-hidden="true"
          tabIndex={-1}
        >
          <img
            src={getOptimizedImageUrl(product.image, 500)}
            alt=""
            className={styles.image}
            loading="lazy"
            decoding="async"
            width={400}
            height={300}
          />
        </Link>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.categoryRow}>
          <span className={styles.category}>{product.category}</span>
          <div className={styles.rating}>
            <RatingStars rating={product.rating} size={12} />
            <span>{product.rating.toFixed(1)}</span>
          </div>
        </div>

        <Link href={`/product/${product.slug}`} className={styles.titleLink}>
          <h3 className={styles.title}>{product.name}</h3>
        </Link>

        <p className={styles.description}>{product.shortDescription}</p>

        {/* Pricing & CTA */}
        <div className={styles.footer}>
          <div className={styles.priceContainer}>
            <div className={styles.priceRow}>
              <span className={styles.price}>{formatCurrency(product.price)}</span>
              {effectiveOriginalPrice > product.price && (
                <span className={styles.originalPrice}>
                  <span className="sr-only">Original price: </span>
                  {formatCurrency(effectiveOriginalPrice)}
                </span>
              )}
            </div>
            {discountPercent && (
              <span className={styles.discountText}>
                <span className="sr-only">Discount: </span>
                {discountPercent}% OFF
              </span>
            )}
          </div>

          <button
            type="button"
            className={styles.addBtn}
            onClick={() => addToCart(product, 1)}
            aria-label={`Add ${product.name} to cart`}
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
