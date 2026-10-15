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
  ShieldCheck,
  AlertCircle,
  Lock,
  FileCheck
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency, getOptimizedImageUrl } from '@/lib/utils';
import { api } from '@/lib/api';
import {
  validateFullName,
  validatePhoneNumber,
  validateEmail,
  validateAddress,
  validatePincode,
  validateCheckoutForm,
  cleanPhoneNumber,
  cleanPincode,
} from '@/lib/validation';
import { loadRazorpayScript, RazorpayOptions, RazorpaySuccessResponse } from '@/lib/razorpay';
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

  // Real-time Validation State
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [deliveryMethod, setDeliveryMethod] = useState<'store_delivery' | 'express' | 'pickup'>('store_delivery');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [placedPaymentId, setPlacedPaymentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate a single field on demand
  const validateField = (name: string, value: string): string | null => {
    let error: string | null = null;
    switch (name) {
      case 'fullName':
        error = validateFullName(value).error;
        break;
      case 'phone':
        error = validatePhoneNumber(value).error;
        break;
      case 'email':
        error = validateEmail(value).error;
        break;
      case 'address':
        error = validateAddress(value).error;
        break;
      case 'pincode':
        error = validatePincode(value).error;
        break;
      default:
        break;
    }

    setFieldErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[name] = error;
      } else {
        delete next[name];
      }
      return next;
    });

    return error;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field as keyof typeof formData]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue = value;

    // Real-time input formatting & constraints
    if (name === 'phone') {
      finalValue = cleanPhoneNumber(value);
    } else if (name === 'pincode') {
      finalValue = cleanPincode(value);
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));

    // Reset general submit error on input
    if (submitError) setSubmitError(null);

    // If the field has been touched or contains input, perform live validation
    if (touched[name] || finalValue.length > 0) {
      validateField(name, finalValue);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      fullName: true,
      phone: true,
      email: true,
      address: true,
      city: true,
      pincode: true,
    });

    // Run complete form validation
    const validation = validateCheckoutForm(formData);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setSubmitError('Please correct the highlighted fields before placing your order.');
      // Auto-focus on first error input
      const firstErrorField = Object.keys(validation.errors)[0];
      if (firstErrorField) {
        const el = document.getElementById(firstErrorField);
        if (el) el.focus();
      }
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const token = localStorage.getItem('src_auth_token') || undefined;

      // 1. Ensure Razorpay Checkout SDK is dynamically loaded
      const isRazorpayLoaded = await loadRazorpayScript();
      if (!isRazorpayLoaded) {
        throw new Error('Unable to connect to Razorpay secure checkout. Please check your internet connection.');
      }

      // 2. Prepare order payload for server-side anti-tamper recalculation
      const orderPayload = {
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
          quantity: item.quantity,
        })),
        notes: `Delivery Method: ${deliveryMethod === 'pickup' ? 'Store Pickup' : 'Direct Store Delivery'}`,
      };

      // 3. Create Razorpay order on backend
      const razorpayOrder = await api.createRazorpayOrder(orderPayload, token);

      // Auto-dispatch 'Order Placed' email via Vercel serverless relay
      if (orderPayload.customerInfo.email) {
        fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order: {
              orderNumber: razorpayOrder.orderNumber,
              customerInfo: orderPayload.customerInfo,
              orderItems: items.map((it) => ({
                name: it.product.name,
                price: it.product.price,
                quantity: it.quantity,
                image: it.product.image,
              })),
              pricing: razorpayOrder.pricing || {
                subtotal: items.reduce((acc, it) => acc + it.product.price * it.quantity, 0),
                deliveryFee: 0,
                total: razorpayOrder.amount / 100,
              },
              paymentMethod: 'razorpay',
              paymentStatus: 'pending',
              orderStatus: 'placed',
              createdAt: new Date(),
            },
            templateType: 'placed',
          }),
        }).catch((err) => console.warn('[Auto Email] Placed email dispatch error:', err));
      }

      // 4. Open Razorpay Standard Checkout modal
      const options: RazorpayOptions = {
        key: razorpayOrder.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'Sriram & Co',
        description: `Order Ref #${razorpayOrder.orderNumber}`,
        image: '/logo.webp',
        order_id: razorpayOrder.razorpayOrderId,
        prefill: {
          name: formData.fullName.trim(),
          email: formData.email.trim() || undefined,
          contact: formData.phone.trim(),
        },
        theme: {
          color: '#15803d',
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            setSubmitError('Payment was cancelled. You can retry whenever you are ready.');
          },
        },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            setIsSubmitting(true);
            // 5. Verify cryptographic HMAC signature on backend
            const verification = await api.verifyRazorpayPayment({
              orderNumber: razorpayOrder.orderNumber,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verification.success) {
              setPlacedOrderId(razorpayOrder.orderNumber);
              setPlacedPaymentId(response.razorpay_payment_id);
              setOrderPlaced(true);
              clearCart();

              // Auto-dispatch 'Order Confirmed' email via Vercel serverless relay
              const confirmedOrder = verification.order || {
                orderNumber: razorpayOrder.orderNumber,
                customerInfo: orderPayload.customerInfo,
                orderItems: items.map((it) => ({
                  name: it.product.name,
                  price: it.product.price,
                  quantity: it.quantity,
                  image: it.product.image,
                })),
                pricing: razorpayOrder.pricing || { total: razorpayOrder.amount / 100 },
                paymentMethod: 'razorpay',
                paymentStatus: 'paid',
                orderStatus: 'confirmed',
                razorpayPaymentId: response.razorpay_payment_id,
                createdAt: new Date(),
              };

              fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  order: confirmedOrder,
                  templateType: 'confirmed',
                }),
              }).catch((err) => console.warn('[Auto Email] Confirmed email dispatch error:', err));
            } else {
              setSubmitError(verification.message || 'Payment signature verification failed. Please contact support.');
            }
          } catch (verifyErr: any) {
            setSubmitError(verifyErr.message || 'Payment verification failed on the server.');
          } finally {
            setIsSubmitting(false);
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      if (typeof rzp.on === 'function') {
        try {
          rzp.on('payment.failed', function (failResp: any) {
            setIsSubmitting(false);
            setSubmitError(`Payment failed: ${failResp?.error?.description || 'Transaction declined by bank.'}`);
          });
        } catch {
          // Fallback gracefully if event listener is not supported by current SDK bundle
        }
      }
      rzp.open();
    } catch (err: any) {
      setSubmitError(err.message || 'Could not initiate online payment. Please check your network and try again.');
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
            <span className={styles.successTag}>Payment Verified &amp; Order Confirmed</span>
            <h1 className={styles.successTitle}>Thank you, {formData.fullName}!</h1>
            <p className={styles.orderIdText}>Order Reference ID: <strong>{placedOrderId}</strong></p>
            {placedPaymentId && (
              <p className={styles.orderIdText} style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '-8px' }}>
                Razorpay Payment Ref: <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{placedPaymentId}</code>
              </p>
            )}
            <p className={styles.successDesc}>
              Your payment has been verified successfully. A representative from our <strong>{formData.city}</strong> store team will contact you at <strong>{formData.phone}</strong> to coordinate your dispatch.
            </p>

            <div className={styles.orderSummaryBox}>
              <h4>Order &amp; Delivery Details</h4>
              <p><strong>Deliver to:</strong> {formData.address}, {formData.city} - {formData.pincode}</p>
              <p><strong>Payment Mode:</strong> 100% Online Payment (Razorpay Verified)</p>
              <p><strong>Status:</strong> Paid &amp; Confirmed</p>
            </div>

            <div className={styles.successActions}>
              <Link href="/orders" className="btn btn-primary btn-lg">
                View My Orders
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
        {submitError && (
          <div className={styles.submitErrorBanner}>
            <AlertCircle size={20} />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className={styles.checkoutGrid} noValidate>
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
                    onBlur={() => handleBlur('fullName')}
                    className={
                      touched.fullName
                        ? fieldErrors.fullName
                          ? styles.inputError
                          : styles.inputValid
                        : ''
                    }
                  />
                  {touched.fullName && fieldErrors.fullName && (
                    <span className={styles.fieldError}>
                      <AlertCircle size={14} />
                      {fieldErrors.fullName}
                    </span>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="phone">Phone Number (10 digits for confirmation call) *</label>
                  <div className={styles.phoneInputGroup}>
                    <span className={styles.phonePrefix}>+91</span>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="9876543210"
                      maxLength={10}
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={() => handleBlur('phone')}
                      className={`${styles.phoneInput} ${
                        touched.phone
                          ? fieldErrors.phone
                            ? styles.inputError
                            : styles.inputValid
                          : ''
                      }`}
                    />
                  </div>
                  {touched.phone && fieldErrors.phone ? (
                    <span className={styles.fieldError}>
                      <AlertCircle size={14} />
                      {fieldErrors.phone}
                    </span>
                  ) : (
                    <span className={styles.fieldHint}>
                      Enter 10-digit mobile number starting with 6, 7, 8, or 9
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address (Optional for invoice receipt)</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ramesh@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  className={
                    touched.email
                      ? fieldErrors.email
                        ? styles.inputError
                        : formData.email
                        ? styles.inputValid
                        : ''
                      : ''
                  }
                />
                {touched.email && fieldErrors.email && (
                  <span className={styles.fieldError}>
                    <AlertCircle size={14} />
                    {fieldErrors.email}
                  </span>
                )}
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
                  onBlur={() => handleBlur('address')}
                  className={
                    touched.address
                      ? fieldErrors.address
                        ? styles.inputError
                        : styles.inputValid
                      : ''
                  }
                />
                {touched.address && fieldErrors.address ? (
                  <span className={styles.fieldError}>
                    <AlertCircle size={14} />
                    {fieldErrors.address}
                  </span>
                ) : (
                  <span className={styles.fieldHint}>
                    Minimum 10 characters required for dispatch accuracy
                  </span>
                )}
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
                    maxLength={6}
                    value={formData.pincode}
                    onChange={handleChange}
                    onBlur={() => handleBlur('pincode')}
                    className={
                      touched.pincode
                        ? fieldErrors.pincode
                          ? styles.inputError
                          : styles.inputValid
                        : ''
                    }
                  />
                  {touched.pincode && fieldErrors.pincode ? (
                    <span className={styles.fieldError}>
                      <AlertCircle size={14} />
                      {fieldErrors.pincode}
                    </span>
                  ) : (
                    <span className={styles.fieldHint}>
                      6-digit postal code
                    </span>
                  )}
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
                <label htmlFor="delivery-store" className={`${styles.optionLabel} ${deliveryMethod === 'store_delivery' ? styles.optionActive : ''}`}>
                  <input
                    id="delivery-store"
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

                <label htmlFor="delivery-pickup" className={`${styles.optionLabel} ${deliveryMethod === 'pickup' ? styles.optionActive : ''}`}>
                  <input
                    id="delivery-pickup"
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

            {/* Step 4: 100% Online Payment via Razorpay */}
            <div className={styles.stepSection}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>4</span>
                <h3>Payment Method</h3>
              </div>
              <div className={styles.optionsList}>
                <div className={`${styles.optionLabel} ${styles.optionActive} ${styles.razorpayOption}`}>
                  <div className={styles.optionContent}>
                    <ShieldCheck size={28} className={styles.razorpayBadgeIcon} />
                    <div className={styles.paymentInfoText}>
                      <div className={styles.paymentHeaderRow}>
                        <strong>100% Secure Online Payment (Razorpay)</strong>
                        <span className={styles.secureTag}>Instant Confirmation</span>
                      </div>
                      <p className={styles.paymentMethodsDesc}>
                        Pay securely using UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, MasterCard, RuPay), NetBanking (50+ Banks) &amp; Wallets.
                      </p>
                      <div className={styles.trustBadgesRow}>
                        <span className={styles.trustPill}>
                          <Lock size={12} className={styles.pillIcon} /> 256-Bit SSL Encrypted
                        </span>
                        <span className={styles.trustPill}>
                          <CheckCircle2 size={12} className={styles.pillIcon} /> Instant Order Confirmation
                        </span>
                        <span className={styles.trustPill}>
                          <FileCheck size={12} className={styles.pillIcon} /> Official GST Invoice
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.noCodNotice}>
                <strong>No Cash on Delivery (COD):</strong> All orders are fulfilled through our verified online payment gateway for immediate automated store dispatch.
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
                    <img
                      src={getOptimizedImageUrl(product.image, 120)}
                      alt={product.name}
                      className={styles.miniThumb}
                      width={48}
                      height={48}
                    />
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
                  ? 'Connecting to Razorpay...'
                  : `Pay Online with Razorpay (${formatCurrency(summary.total)})`}
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
