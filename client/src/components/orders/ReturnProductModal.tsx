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
        // Dual-dispatch: Trigger beautifully formatted Vercel email relay for return request directly from the browser
        const itemQty = Number(item.quantity || 1);
        const itemPrice = Number(item.price || order.pricing?.total || 0);
        const itemTotal = itemPrice * itemQty;
        const orderTotal = Number(order.pricing?.total || itemTotal);
        const customer = order.customerInfo || {};
        const paymentId = order.razorpayPaymentId || 'N/A';
        const requestedDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        const adminUrl = 'https://www.sriramandco.in/admin/orders?status=return_requested';

        fetch('/api/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-relay-secret': 'src_sec_8f93b2a1c0d45e67a9b8c7d6e5f4a3b2',
          },
          body: JSON.stringify({
            secret: 'src_sec_8f93b2a1c0d45e67a9b8c7d6e5f4a3b2',
            to: 'ramkumar@sriramandco.in',
            replyTo: customer.email || 'support@sriramandco.com',
            subject: `[Return Request] Order #${order.orderNumber} - ₹${itemTotal.toLocaleString('en-IN')} - ${item.name}`,
            html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Customer Return Request Submitted</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a; line-height:1.5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Top Brand Header -->
          <tr>
            <td style="background-color:#174A2B; padding:18px 24px; border-bottom:3px solid #14532d;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="color:#ffffff; font-size:18px; font-weight:800; letter-spacing:-0.3px; text-transform:uppercase;">Sri Ram &amp; Co</span>
                    <span style="display:block; color:#bbf7d0; font-size:11px; font-weight:500; margin-top:2px;">Home Appliances &amp; Kitchenware · Store Admin Notification</span>
                  </td>
                  <td align="right">
                    <span style="background-color:rgba(255,255,255,0.15); color:#ffffff; font-size:11px; font-weight:600; padding:4px 10px; border-radius:999px; text-transform:uppercase;">
                      Store Portal
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Alert Banner -->
          <tr>
            <td style="background:linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%); padding:20px 24px; border-bottom:1px solid #fecaca;">
              <span style="display:inline-block; background-color:#dc2626; color:#ffffff; font-size:10px; font-weight:700; padding:3px 8px; border-radius:6px; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">
                Action Required · Reverse Pickup Review
              </span>
              <h1 style="margin:0 0 4px 0; color:#991b1b; font-size:20px; font-weight:800; letter-spacing:-0.3px;">
                Customer Return Request Submitted
              </h1>
              <p style="margin:0; color:#7f1d1d; font-size:13px;">
                Order <strong style="color:#991b1b;">#${order.orderNumber}</strong> &bull; Requested on ${requestedDate}
              </p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:28px 24px;">

              <!-- Product & Return Financial Value Card -->
              <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:18px 20px; margin-bottom:22px;">
                <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:#64748b; letter-spacing:0.5px; margin-bottom:8px;">
                  Item Requested For Return
                </div>
                
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <div style="font-size:16px; font-weight:700; color:#0f172a; margin-bottom:4px;">
                        ${item.name}
                      </div>
                      <div style="font-size:13px; color:#64748b;">
                        Quantity: <strong style="color:#0f172a;">${itemQty}</strong> &bull; Unit Price: <strong style="color:#0f172a;">₹${itemPrice.toLocaleString('en-IN')}</strong>
                      </div>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <div style="font-size:11px; font-weight:600; text-transform:uppercase; color:#dc2626; margin-bottom:2px;">
                        Return Value
                      </div>
                      <div style="font-size:22px; font-weight:800; color:#174A2B;">
                        ₹${itemTotal.toLocaleString('en-IN')}
                      </div>
                      <div style="font-size:11px; color:#16a34a; font-weight:600; margin-top:2px;">
                        Order Total: ₹${orderTotal.toLocaleString('en-IN')}
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Return Reason & Customer Fault Description -->
              <div style="background-color:#fffbeb; border:1px solid #fde68a; border-left:4px solid #f59e0b; border-radius:10px; padding:16px 18px; margin-bottom:22px;">
                <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:#b45309; letter-spacing:0.5px; margin-bottom:4px;">
                  Primary Return Reason
                </div>
                <div style="font-size:15px; font-weight:700; color:#92400e; margin-bottom:12px;">
                  ⚠️ ${reason}
                </div>

                <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:#78350f; letter-spacing:0.5px; margin-bottom:4px;">
                  Customer Fault Description &amp; Feedback:
                </div>
                <div style="background-color:#ffffff; border:1px solid #fef3c7; border-radius:8px; padding:12px 14px; font-size:13.5px; color:#451a03; line-height:1.5; font-style:italic;">
                  &ldquo;${faultDetails.trim() || 'No additional fault details provided.'}&rdquo;
                </div>
              </div>

              <!-- Customer Contact & Reverse Pickup Details -->
              <div style="border:1px solid #e2e8f0; border-radius:12px; padding:18px 20px; margin-bottom:24px;">
                <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:#64748b; letter-spacing:0.5px; margin-bottom:12px;">
                  Customer &amp; Reverse Pickup Address
                </div>

                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13.5px;">
                  <tr>
                    <td style="padding:6px 0; color:#64748b; width:34%;"><strong>Customer Name:</strong></td>
                    <td style="padding:6px 0; color:#0f172a; font-weight:600;">${customer.name || 'Customer'}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0; color:#64748b;"><strong>Mobile Number:</strong></td>
                    <td style="padding:6px 0;">
                      <a href="tel:${customer.phone || ''}" style="color:#15803d; font-weight:700; text-decoration:none;">
                        📞 ${customer.phone || 'N/A'}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0; color:#64748b;"><strong>Customer Email:</strong></td>
                    <td style="padding:6px 0;">
                      <a href="mailto:${customer.email || ''}" style="color:#2563eb; text-decoration:none;">
                        ✉️ ${customer.email || 'N/A'}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0; color:#64748b; vertical-align:top;"><strong>Pickup Address:</strong></td>
                    <td style="padding:6px 0; color:#0f172a; line-height:1.4;">
                      ${customer.address || ''}${customer.city ? ', ' + customer.city : ''}${customer.postalCode ? ' - ' + customer.postalCode : ''}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0; color:#64748b;"><strong>Razorpay Payment ID:</strong></td>
                    <td style="padding:6px 0; color:#0f172a; font-family:monospace; font-size:12px;">
                      ${paymentId}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0; color:#64748b;"><strong>Policy Agreement:</strong></td>
                    <td style="padding:6px 0; color:#15803d; font-weight:600;">
                      ✓ Customer agreed to 3-Day Return &amp; Replacement terms
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Action Button to Admin Panel -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${adminUrl}" style="display:inline-block; background-color:#174A2B; color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; padding:14px 28px; border-radius:10px; box-shadow:0 2px 4px rgba(23,74,43,0.2);">
                      Review &amp; Schedule Reverse Pickup &rarr;
                    </a>
                    <span style="display:block; font-size:11px; color:#64748b; margin-top:8px;">
                      Or log in to Store Admin Panel &rarr; Orders &rarr; Return Requests tab
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Store Policy SLA Note -->
              <div style="background-color:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:12px 14px; font-size:12px; color:#166534; line-height:1.4;">
                <strong>Sri Ram &amp; Co SLA:</strong> Customers are informed that reverse pickup inspection occurs within 24–48 business hours. Please contact customer or assign reverse pickup courier promptly.
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc; border-top:1px solid #e2e8f0; padding:20px 24px; text-align:center;">
              <p style="margin:0 0 6px 0; font-size:12px; font-weight:600; color:#0f172a;">Sri Ram &amp; Co</p>
              <p style="margin:0; font-size:11px; color:#64748b;">
                No. 11, Vinola Complex, Thanjai Main Road, Trichy &bull; +91 93454 03136 &bull; GSTIN: 33ARHPR6139B1ZX
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
            text: `URGENT: Product Return Request Received\n\nOrder Number: #${order.orderNumber}\nProduct: ${item.name} (Qty: ${itemQty})\nProduct Amount: ₹${itemPrice.toLocaleString('en-IN')} (Total Return Value: ₹${itemTotal.toLocaleString('en-IN')})\nOrder Total: ₹${orderTotal.toLocaleString('en-IN')}\n\nRETURN REASON:\nReason: ${reason}\nCustomer Feedback: "${faultDetails.trim()}"\n\nCUSTOMER DETAILS:\nName: ${customer.name || 'N/A'}\nPhone: ${customer.phone || 'N/A'}\nEmail: ${customer.email || 'N/A'}\nAddress: ${customer.address || ''}, ${customer.city || ''} ${customer.postalCode || ''}\nRazorpay Payment ID: ${paymentId}\n\nReview in Admin Panel: ${adminUrl}`,
          }),
        }).catch((e) => console.warn('[Return Relay] Direct return alert error:', e));

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
              <RotateCcw size={12} /> 3-Day Replacement &amp; Return
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
                Warranty &amp; Service Policy
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
