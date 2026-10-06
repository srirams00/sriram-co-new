'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';
import styles from './cart.module.css';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart, summary } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === 'WELCOME10') {
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponError('Invalid coupon code. Try WELCOME10');
    }
  };

  const finalTotal = couponApplied ? Math.max(0, summary.total - 250) : summary.total;

  if (items.length === 0) {
    return (
      <div className={styles.emptyCartPage}>
        <div className="container">
          <div className={styles.emptyCard}>
            <div className={styles.emptyIcon}>
              <ShoppingBag size={48} />
            </div>
            <h2>Your shopping cart is empty</h2>
            <p>Looks like you haven't added any home appliances or tools to your cart yet.</p>
            <Link href="/shop" className="btn btn-primary btn-lg">
              Explore Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cartPage}>
      <div className={styles.pageHeader}>
        <div className="container">
          <Link href="/shop" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Continue Shopping</span>
          </Link>
          <h1 className="heading-section">Shopping Cart ({summary.itemCount} items)</h1>
        </div>
      </div>

      <div className="container">
        <div className={styles.cartLayout}>
          {/* Items Column */}
          <div className={styles.itemsColumn}>
            {/* Free Shipping Alert */}
            <div className={styles.shippingNotice}>
              {summary.subtotal >= 1000 ? (
                <p>✓ Your order qualifies for <strong>FREE direct store delivery</strong>!</p>
              ) : (
                <p>
                  Add <strong>{formatCurrency(1000 - summary.subtotal)}</strong> more to unlock <strong>FREE store delivery</strong>
                </p>
              )}
            </div>

            {/* Items Table/Cards */}
            <div className={styles.itemsList}>
              {items.map(({ product, quantity }) => (
                <div key={product.id} className={styles.itemRow}>
                  <div className={styles.itemImageWrapper}>
                    <img src={product.image} alt={product.name} className={styles.itemImage} />
                  </div>

                  <div className={styles.itemDetails}>
                    <div className={styles.itemHeader}>
                      <div>
                        <span className={styles.itemCategory}>{product.category}</span>
                        <Link href={`/product/${product.slug}`} className={styles.itemName}>
                          {product.name}
                        </Link>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        className={styles.deleteBtn}
                        title="Remove"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className={styles.itemActions}>
                      <div className={styles.quantityPicker}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className={styles.qtyBtn}
                        >
                          <Minus size={14} />
                        </button>
                        <span className={styles.qtyNum}>{quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className={styles.qtyBtn}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className={styles.priceCol}>
                        <span className={styles.unitPrice}>{formatCurrency(product.price)} each</span>
                        <strong className={styles.totalPrice}>
                          {formatCurrency(product.price * quantity)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.clearCartRow}>
              <button type="button" onClick={clearCart} className={styles.clearBtn}>
                Clear entire cart
              </button>
            </div>
          </div>

          {/* Order Summary Column */}
          <div className={styles.summaryColumn}>
            <div className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>Order Summary</h3>

              <div className={styles.summaryList}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(summary.subtotal)}</span>
                </div>

                <div className={styles.summaryRow}>
                  <span>Store Delivery</span>
                  <span>
                    {summary.deliveryFee === 0 ? (
                      <strong className={styles.freeGreen}>FREE</strong>
                    ) : (
                      formatCurrency(summary.deliveryFee)
                    )}
                  </span>
                </div>

                {couponApplied && (
                  <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                    <span>Promo Discount (WELCOME10)</span>
                    <span>- {formatCurrency(250)}</span>
                  </div>
                )}

                <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                  <span>Total Amount</span>
                  <span className={styles.finalAmount}>{formatCurrency(finalTotal)}</span>
                </div>
              </div>

              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className={styles.couponForm}>
                <input
                  type="text"
                  placeholder="Promo code (e.g. WELCOME10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className={styles.couponInput}
                />
                <button type="submit" className="btn btn-secondary btn-sm">
                  Apply
                </button>
              </form>
              {couponError && <p className={styles.couponError}>{couponError}</p>}
              {couponApplied && <p className={styles.couponSuccess}>✓ Coupon WELCOME10 applied (₹250 off)</p>}

              <Link href="/checkout" className={`btn btn-primary ${styles.checkoutBtn}`}>
                <span>Proceed to Checkout</span>
                <ArrowRight size={18} />
              </Link>

              <div className={styles.trustBadges}>
                <div className={styles.trustItem}>
                  <ShieldCheck size={16} className={styles.trustIcon} />
                  <span>Pay by UPI or card</span>
                </div>
                <div className={styles.trustItem}>
                  <ShieldCheck size={16} className={styles.trustIcon} />
                  <span>35-year trusted local store service</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
