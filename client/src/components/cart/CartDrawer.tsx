'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';
import styles from './CartDrawer.module.css';

export default function CartDrawer() {
  const { items, removeFromCart, updateQuantity, summary, isCartDrawerOpen, setIsCartDrawerOpen } = useCart();

  if (!isCartDrawerOpen) return null;

  return (
    <div className={styles.overlay} onClick={() => setIsCartDrawerOpen(false)}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerTitle}>
            <ShoppingBag size={20} className={styles.bagIcon} />
            <h3>Your Cart ({summary.itemCount})</h3>
          </div>
          <button 
            type="button" 
            className={styles.closeBtn} 
            onClick={() => setIsCartDrawerOpen(false)}
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className={styles.shippingBar}>
          {summary.subtotal >= 1000 ? (
            <p className={styles.freeShippingActive}>🎉 You have unlocked <strong>FREE direct delivery</strong>!</p>
          ) : (
            <p className={styles.freeShippingRemaining}>
              Add <strong>{formatCurrency(1000 - summary.subtotal)}</strong> more for <strong>FREE direct delivery</strong>
            </p>
          )}
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${Math.min(100, (summary.subtotal / 1000) * 100)}%` }} 
            />
          </div>
        </div>

        {/* Items List */}
        <div className={styles.drawerBody}>
          {items.length === 0 ? (
            <div className={styles.emptyCart}>
              <div className={styles.emptyIconCircle}>
                <ShoppingBag size={32} />
              </div>
              <h4>Your shopping cart is empty</h4>
              <p>Explore our curated home appliances, tools, and kitchen essentials.</p>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => setIsCartDrawerOpen(false)}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className={styles.itemsList}>
              {items.map(({ product, quantity }) => (
                <div key={product.id} className={styles.cartItem}>
                  <div className={styles.itemImgWrapper}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className={styles.itemImg}
                    />
                  </div>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemTop}>
                      <span className={styles.itemCategory}>{product.category}</span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        className={styles.removeBtn}
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <h5 className={styles.itemName}>{product.name}</h5>

                    <div className={styles.itemBottom}>
                      <div className={styles.quantityControls}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className={styles.qtyBtn}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className={styles.qtyCount}>{quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className={styles.qtyBtn}
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <span className={styles.itemPrice}>
                        {formatCurrency(product.price * quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / Summary */}
        {items.length > 0 && (
          <div className={styles.drawerFooter}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span className={styles.summaryPrice}>{formatCurrency(summary.subtotal)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Direct Delivery</span>
              <span>{summary.deliveryFee === 0 ? <strong className={styles.freeTag}>FREE</strong> : formatCurrency(summary.deliveryFee)}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>Estimated Total</span>
              <span className={styles.totalPrice}>{formatCurrency(summary.total)}</span>
            </div>

            <div className={styles.ctaGroup}>
              <Link 
                href="/checkout" 
                className={`btn btn-primary ${styles.checkoutBtn}`}
                onClick={() => setIsCartDrawerOpen(false)}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={18} />
              </Link>
              <Link 
                href="/cart" 
                className={`btn btn-secondary ${styles.viewCartBtn}`}
                onClick={() => setIsCartDrawerOpen(false)}
              >
                View Full Cart
              </Link>
            </div>
            <p className={styles.guaranteeText}>
              ✓ Cash on delivery / UPI available • Fast local dispatch
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
