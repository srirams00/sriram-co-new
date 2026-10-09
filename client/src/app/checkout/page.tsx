'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Truck, 
  Store, 
  CreditCard, 
  QrCode, 
  ArrowLeft, 
  ShieldCheck 
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';
import styles from './checkout.module.css';

export default function CheckoutPage() {
  const { items, summary, clearCart } = useCart();

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: 'Trichy',
    pincode: '',
    notes: '',
  });

  const [deliveryMethod, setDeliveryMethod] = useState<'store_delivery' | 'express' | 'pickup'>('store_delivery');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.address) {
      alert('Please fill in your name, phone number, and delivery address.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Find fallback user token/id if available
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('src_user') : null;
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      const orderPayload = {
        user: parsedUser?.id || undefined,
        customerInfo: {
          name: formData.fullName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined,
          address: formData.address.trim(),
          city: formData.city.trim(),
          postalCode: formData.pincode.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        },
        orderItems: items.map((item) => ({
          product: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image,
        })),
        paymentMethod: paymentMethod,
        pricing: {
          subtotal: summary.subtotal,
          deliveryFee: summary.deliveryFee,
          discount: summary.discount,
          total: summary.total,
        },
      };

      const savedOrder = await api.createOrder(orderPayload);
      setPlacedOrderId(savedOrder.orderNumber);
      setOrderPlaced(true);
      clearCart();
    } catch (err: any) {
      alert(`Could not process order: ${err.message || 'Please check your information and try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className={styles.successPage}>
        <div className="container">
          <div className={styles.successCard}>
            <div className={styles.successIcon}>
              <CheckCircle2 size={54} color="#16a34a" />
            </div>
            <span className={styles.successTag}>Order Confirmed</span>
            <h1 className={styles.successTitle}>Thank you, {formData.fullName}!</h1>
            <p className={styles.orderIdText}>Order Reference ID: <strong>{placedOrderId}</strong></p>
            <p className={styles.successDesc}>
              We have received your order. A representative from our <strong>{formData.city}</strong> store team will call you at <strong>{formData.phone}</strong> within 30 minutes to confirm your delivery schedule.
            </p>

            <div className={styles.orderSummaryBox}>
              <h4>Delivery Details</h4>
              <p><strong>Deliver to:</strong> {formData.address}, {formData.city} - {formData.pincode}</p>
              <p><strong>Payment Choice:</strong> {paymentMethod === 'upi' ? 'UPI' : 'Card'}</p>
            </div>

            <div className={styles.successActions}>
              <Link href="/" className="btn btn-primary btn-lg">
                Return to Home
              </Link>
              <Link href="/shop" className="btn btn-secondary btn-lg">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Your cart is empty</h2>
        <p style={{ margin: '16px 0 24px', color: 'var(--color-text-secondary)' }}>
          Please add items to your cart before proceeding to checkout.
        </p>
        <Link href="/shop" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.checkoutPage}>
      <div className={styles.pageHeader}>
        <div className="container">
          <Link href="/cart" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Return to Cart</span>
          </Link>
          <h1 className="heading-section">Checkout</h1>
        </div>
      </div>

      <div className="container">
        <form onSubmit={handleSubmitOrder} className={styles.checkoutGrid}>
          {/* Left Column: Information Steps */}
          <div className={styles.stepsCol}>
            {/* Step 1: Customer Contact */}
            <div className={styles.stepSection}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>1</span>
                <h3>Customer Information</h3>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="phone">Phone Number (Required for confirmation call) *</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address (Optional for invoice)</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ramesh@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Step 2: Delivery Address */}
            <div className={styles.stepSection}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>2</span>
                <h3>Delivery Address</h3>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="address">Street Address, Door No., Landmark *</label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  required
                  placeholder="House/Door No, Street Name, Landmark..."
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="city">City / Region *</label>
                  <select
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                  >
                    <option value="Trichy">Trichy (Same-day / Next-day store dispatch)</option>
                    <option value="Chennai">Chennai (Fast store dispatch)</option>
                    <option value="Madurai">Madurai</option>
                    <option value="Coimbatore">Coimbatore</option>
                    <option value="Salem">Salem</option>
                    <option value="Thanjavur">Thanjavur</option>
                    <option value="Other Tamil Nadu">Other Tamil Nadu Location</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="pincode">PIN Code *</label>
                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    required
                    placeholder="620002"
                    value={formData.pincode}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Delivery Method */}
            <div className={styles.stepSection}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>3</span>
                <h3>Delivery Method</h3>
              </div>
              <div className={styles.optionsList}>
                <label className={`${styles.optionLabel} ${deliveryMethod === 'store_delivery' ? styles.optionActive : ''}`}>
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="store_delivery"
                    checked={deliveryMethod === 'store_delivery'}
                    onChange={() => setDeliveryMethod('store_delivery')}
                  />
                  <div className={styles.optionContent}>
                    <Truck size={20} className={styles.optionIcon} />
                    <div>
                      <strong>Standard Direct Store Delivery</strong>
                      <span>Dispatched directly by Sriram &amp; Co delivery team within 24–48 hours</span>
                    </div>
                  </div>
                  <strong className={styles.freeText}>FREE</strong>
                </label>

                <label className={`${styles.optionLabel} ${deliveryMethod === 'pickup' ? styles.optionActive : ''}`}>
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="pickup"
                    checked={deliveryMethod === 'pickup'}
                    onChange={() => setDeliveryMethod('pickup')}
                  />
                  <div className={styles.optionContent}>
                    <Store size={20} className={styles.optionIcon} />
                    <div>
                      <strong>Store Counter Pickup</strong>
                      <span>Pick up from our Trichy Main Branch or Chennai Experience Store</span>
                    </div>
                  </div>
                  <strong className={styles.freeText}>FREE</strong>
                </label>
              </div>
            </div>

            {/* Step 4: Payment Option */}
            <div className={styles.stepSection}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>4</span>
                <h3>Payment Method</h3>
              </div>
              <div className={styles.optionsList}>
                <label className={`${styles.optionLabel} ${paymentMethod === 'upi' ? styles.optionActive : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                  />
                  <div className={styles.optionContent}>
                    <QrCode size={20} className={styles.optionIcon} />
                    <div>
                      <strong>UPI (GPay / PhonePe / Paytm)</strong>
                      <span>Scan our driver's store QR code when the parcel arrives at your door</span>
                    </div>
                  </div>
                </label>

                <label className={`${styles.optionLabel} ${paymentMethod === 'card' ? styles.optionActive : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                  />
                  <div className={styles.optionContent}>
                    <CreditCard size={20} className={styles.optionIcon} />
                    <div>
                      <strong>Debit or Credit Card</strong>
                      <span>Pay by debit/credit card via our handheld POS terminal</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Review */}
          <div className={styles.summaryCol}>
            <div className={styles.summaryBox}>
              <h3 className={styles.summaryTitle}>Your Order ({summary.itemCount} items)</h3>

              <div className={styles.miniItemsList}>
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className={styles.miniItem}>
                    <img src={product.image} alt={product.name} className={styles.miniThumb} />
                    <div className={styles.miniInfo}>
                      <span className={styles.miniName}>{product.name}</span>
                      <span className={styles.miniQty}>Qty: {quantity}</span>
                    </div>
                    <span className={styles.miniPrice}>
                      {formatCurrency(product.price * quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className={styles.calcRows}>
                <div className={styles.calcRow}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(summary.subtotal)}</span>
                </div>
                <div className={styles.calcRow}>
                  <span>Store Delivery</span>
                  <span className={styles.freeGreen}>FREE</span>
                </div>
                <div className={`${styles.calcRow} ${styles.totalRow}`}>
                  <span>Total Payable</span>
                  <span className={styles.totalAmount}>{formatCurrency(summary.total)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`btn btn-primary btn-lg ${styles.placeOrderBtn}`}
              >
                {isSubmitting
                  ? 'Saving Order...'
                  : `Place Order (${formatCurrency(summary.total)})`}
              </button>

              <div className={styles.securityNote}>
                <ShieldCheck size={18} className={styles.secIcon} />
                <span>
                  Zero prepayment risk. We confirm every order by phone prior to dispatch.
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
