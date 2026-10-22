'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Order, OrderItem } from '@/types/order';
import { api } from '@/lib/api';
import { formatCurrency, getOptimizedImageUrl } from '@/lib/utils';
import { RETURN_REASONS, validateReturnSubmission } from '@/lib/returnValidation';
import { AlertCircle, CheckCircle, Loader2, RotateCcw, X } from 'lucide-react';
import styles from './ReturnProductModal.module.css';

interface ReturnProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  item: OrderItem;
  onSuccess: (updatedOrder: Order) => void;
}



export default function ReturnProductModal({
  isOpen,
  onClose,
  order,
  item,
  onSuccess,
}: ReturnProductModalProps) {
  const [reason, setReason] = useState<string>(RETURN_REASONS[0]);
  const [faultDetails, setFaultDetails] = useState('');
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateReturnSubmission({ reason, faultDetails, agreedToPolicy });
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0] || 'Please check your inputs.';
      setError(firstError);
      return;
    }

    setLoading(true);
    try {
      const res = await api.requestReturn(order.id || order.orderNumber, {
        itemId: item.product,
        reason,
        faultDetails: faultDetails.trim(),
        agreedToPolicy: true,
        phone: order.customerInfo?.phone,
        email: order.customerInfo?.email,
      });

      if (res.success && res.returnRequest) {
        const updated: Order = {
          ...order,
          orderStatus: 'return_requested',
          returnRequest: res.returnRequest,
        };
        onSuccess(updated);
        onClose();
      } else {
        setError(res.message || 'Failed to submit return request');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while submitting your return request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="return-modal-title">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <span className={styles.badge}>
              <RotateCcw size={12} /> 7-Day Replacement &amp; Return
            </span>
            <h2 id="return-modal-title" className={styles.title}>
              Return Product
            </h2>
            <p className={styles.subtitle}>Order #{order.orderNumber}</p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close return modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Item Summary Card */}
        <div className={styles.itemSummary}>
          <img
            src={getOptimizedImageUrl(item.image, 120)}
            alt={item.name}
            className={styles.itemImage}
          />
          <div className={styles.itemDetails}>
            <h4 className={styles.itemName} title={item.name}>
              {item.name}
            </h4>
            <p className={styles.itemMeta}>
              Qty: {item.quantity} &bull; <span className={styles.itemPrice}>{formatCurrency(item.price)}</span>
            </p>
          </div>
        </div>

        {/* Return Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorBanner} role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Reason Selection */}
          <div className={styles.field}>
            <label htmlFor="return-reason" className={styles.label}>
              Reason for Return <span className={styles.required}>*</span>
            </label>
            <select
              id="return-reason"
              className={styles.select}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              required
            >
              {RETURN_REASONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Fault Details / Feedback */}
          <div className={styles.field}>
            <label htmlFor="fault-details" className={styles.label}>
              Describe the Fault or Issue <span className={styles.required}>*</span>
            </label>
            <textarea
              id="fault-details"
              className={styles.textarea}
              placeholder="Tell our quality team what was wrong with the product (e.g. handle cracked, didn't turn on, missing parts)..."
              value={faultDetails}
              onChange={(e) => setFaultDetails(e.target.value)}
              disabled={loading}
              required
            />
            <p className={styles.helpText}>Minimum 5 characters. Be as specific as possible to expedite pickup.</p>
          </div>

          {/* Policy Agreement Checkbox */}
          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="agree-policy"
              className={styles.checkbox}
              checked={agreedToPolicy}
              onChange={(e) => setAgreedToPolicy(e.target.checked)}
              disabled={loading}
              required
            />
            <label htmlFor="agree-policy" className={styles.checkboxLabel}>
              I confirm the item is in its original packaging with all included accessories. I accept the{' '}
              <Link href="/terms" target="_blank" className={styles.link}>
                Terms &amp; Conditions
              </Link>
              ,{' '}
              <Link href="/refund-policy" target="_blank" className={styles.link}>
                Return &amp; Refund Policy
              </Link>
              , and{' '}
              <Link href="/warranty-policy" target="_blank" className={styles.link}>
                7-Day Warranty Policy
              </Link>
              .
            </label>
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || !agreedToPolicy}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <RotateCcw size={16} /> Submit Return Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
