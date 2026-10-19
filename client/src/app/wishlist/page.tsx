'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { api } from '@/lib/api';
import { Product } from '@/types/product';
import { formatCurrency, getOptimizedImageUrl, getEffectiveOriginalPrice } from '@/lib/utils';
import styles from './wishlist.module.css';

export default function WishlistPage() {
  const { wishlistIds, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadWishlistProducts() {
      try {
        setLoading(true);
        const allProducts = await api.getProducts();
        if (isMounted) {
          const filtered = allProducts.filter((p) => wishlistIds.includes(p.id));
          setProducts(filtered);
        }
      } catch (err) {
        console.error('Failed to load wishlist items:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadWishlistProducts();
    return () => {
      isMounted = false;
    };
  }, [wishlistIds]);

  const handleMoveToCart = (product: Product) => {
    addToCart(product, 1);
  };

  if (loading) {
    return (
      <div className={styles.wishlistPage}>
        <div className={styles.pageHeader}>
          <div className="container">
            <h1 className="heading-section">Your Wishlist</h1>
          </div>
        </div>
        <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
          <p>Loading your saved items...</p>
        </div>
      </div>
    );
  }

  if (wishlistIds.length === 0 || products.length === 0) {
    return (
      <div className={styles.emptyWishlistPage}>
        <div className="container">
          <div className={styles.emptyCard}>
            <div className={styles.emptyIcon}>
              <Heart size={36} />
            </div>
            <h2>Your wishlist is empty</h2>
            <p>Save items you like while shopping so you can easily review and order them later.</p>
            <Link href="/shop" className="btn btn-primary btn-lg">
              Explore Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wishlistPage}>
      <div className={styles.pageHeader}>
        <div className="container">
          <Link href="/shop" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Continue Shopping</span>
          </Link>
          <h1 className="heading-section">My Wishlist ({products.length} {products.length === 1 ? 'item' : 'items'})</h1>
        </div>
      </div>

      <div className="container">
        <div className={styles.wishlistGrid}>
          {products.map((product) => {
            const effectiveOriginalPrice = getEffectiveOriginalPrice(product.price, product.originalPrice);
            return (
              <div key={product.id} className={styles.wishlistCard}>
                <div className={styles.imageWrapper}>
                  <Link href={`/product/${product.slug}`}>
                    <img
                      src={getOptimizedImageUrl(product.image, 400)}
                      alt={product.name}
                      className={styles.image}
                      loading="lazy"
                    />
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id)}
                    className={styles.removeBtn}
                    aria-label={`Remove ${product.name} from wishlist`}
                    title="Remove from wishlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className={styles.content}>
                  <span className={styles.category}>{product.category}</span>
                  <Link href={`/product/${product.slug}`} className={styles.title}>
                    {product.name}
                  </Link>

                  <div className={styles.priceContainer}>
                    <span className={styles.price}>{formatCurrency(product.price)}</span>
                    {effectiveOriginalPrice > product.price && (
                      <span className={styles.originalPrice}>
                        {formatCurrency(effectiveOriginalPrice)}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleMoveToCart(product)}
                    className={`btn btn-primary ${styles.moveToCartBtn}`}
                  >
                    <ShoppingBag size={16} />
                    <span>Move to Cart</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
