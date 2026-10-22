'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Search, AlertCircle, CheckCircle2, X, RotateCcw } from 'lucide-react';
import ReturnProductModal from '@/components/orders/ReturnProductModal';
import { formatCurrency, getOptimizedImageUrl } from '@/lib/utils';
import { isEligibleForReturn } from '@/lib/returnValidation';
import { api } from '@/lib/api';
import { Order, OrderStatus, OrderItem } from '@/types/order';
import styles from './orders.module.css';

const ORDER_STEPS = ['Order Placed', 'Shipped', 'Out for Delivery', 'Delivered'];

function getStatusLabel(status: OrderStatus): string {
  if (status === 'placed' || status === 'confirmed') return 'Order Placed';
  if (status === 'shipped' || status === 'processing') return 'Shipped';
  if (status === 'out_for_delivery') return 'Out for Delivery';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') return null;

  const stepMap: Record<OrderStatus, number> = {
    placed: 0,
    confirmed: 0,
    shipped: 1,
    processing: 1,
    out_for_delivery: 2,
    delivered: 3,
    return_requested: 3,
    returned: 3,
    cancelled: -1,
  };
  const currentStep = stepMap[status] ?? 0;

  return (
    <div className={styles.timeline} aria-label={`Order progress: ${getStatusLabel(status)}`}>
      {ORDER_STEPS.map((step, index) => {
        const isDone = status === 'delivered' || index <= currentStep;
        const isCurrent = index === currentStep && status !== 'delivered';

        return (
          <React.Fragment key={step}>
            {index > 0 && <div className={styles.timelineLine} />}
            <div
              className={`${styles.timelineStep} ${isDone ? styles.stepDone : ''} ${isCurrent ? styles.stepCurrent : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className={styles.dot} aria-label={isDone ? 'Complete' : `Step ${index + 1}`}>
                {isDone ? '✓' : index + 1}
              </div>
              <span>{step}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function getPaymentBadgeText(status: string): string {
  switch (status) {
    case 'paid':
      return '✓ Paid';
    case 'refunded':
      return '✓ Refunded';
    case 'refund_initiated':
      return '⏳ Refund Initiated';
    case 'failed':
      return '✕ Failed';
    default:
      return status.toUpperCase();
  }
}

function getPaymentBadgeColor(status: string): string {
  switch (status) {
    case 'paid':
    case 'refunded':
      return '#16a34a';
    case 'refund_initiated':
      return '#2563eb';
    case 'failed':
      return '#dc2626';
    default:
      return '#d97706';
  }
}

function OrderCard({
  order,
  highlighted = false,
  onCancelClick,
  onReturnClick,
}: {
  order: Order;
  highlighted?: boolean;
  onCancelClick?: (order: Order) => void;
  onReturnClick?: (order: Order, item: OrderItem) => void;
}) {
  const isDelivered = order.orderStatus === 'delivered';
  const isCancelled = order.orderStatus === 'cancelled';
  const isPreDispatch = ['placed', 'confirmed', 'processing'].includes(order.orderStatus);
  const isWithin7Days = isDelivered && isEligibleForReturn(order.updatedAt || order.createdAt);
  const isReturnRequested = order.orderStatus === 'return_requested' || Boolean(order.returnRequest);

  return (
    <div
      className={styles.orderCard}
      style={highlighted ? { border: '2px solid #18A957' } : undefined}
    >
      <div className={styles.orderHeader}>
        <div>
          <span className={styles.orderRef}>
            Order Ref: <strong>{order.orderNumber}</strong>
          </span>
          <span className={styles.orderDate}>
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN')} · {order.paymentMethod === 'razorpay' ? 'Online (Razorpay)' : order.paymentMethod.toUpperCase()} · <strong style={{ color: getPaymentBadgeColor(order.paymentStatus) }}>{getPaymentBadgeText(order.paymentStatus)}</strong>
          </span>
          {order.razorpayPaymentId && (
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Transaction Ref: <code>{order.razorpayPaymentId}</code>
            </span>
          )}
        </div>
        <div className={styles.statusBadge}>
          <span
            className={isDelivered ? styles.badgeDelivered : styles.badgeActive}
            style={isCancelled ? { color: '#DC2626', backgroundColor: '#fee2e2' } : undefined}
          >
            {isDelivered ? '✓ ' : isCancelled ? '✕ ' : '🚚 '}
            {getStatusLabel(order.orderStatus)}
          </span>
        </div>
      </div>

      <OrderTimeline status={order.orderStatus} />

      <div className={styles.itemsBlock}>
        {order.orderItems.map((item, index) => (
          <div key={`${item.product}-${index}`} className={styles.itemRow}>
            <img
              src={getOptimizedImageUrl(item.image, 160)}
              alt={item.name}
              className={styles.itemImg}
              width={64}
              height={64}
            />
            <div className={styles.itemInfo}>
              <h4>{item.name}</h4>
              <p>Quantity: {item.quantity}</p>
              {isReturnRequested && (
                <span className={styles.returnBadge}>
                  <RotateCcw size={12} /> Return Requested ({order.returnRequest?.reason || 'Under Review'})
                </span>
              )}
              {isWithin7Days && !isReturnRequested && onReturnClick && (
                <button
                  type="button"
                  className={styles.returnProductBtn}
                  onClick={() => onReturnClick(order, item)}
                >
                  <RotateCcw size={12} /> Return Product
                </button>
              )}
            </div>
            <strong className={styles.itemPrice}>
              {formatCurrency(item.price * item.quantity)}
            </strong>
          </div>
        ))}
      </div>

      <div className={styles.orderFooter}>
        <div className={styles.footerAddress}>
          <strong>Deliver to:</strong> {order.customerInfo.address}, {order.customerInfo.city}
        </div>
        <div className={styles.footerTotal}>
          <span>Total Amount:</span>
          <strong>{formatCurrency(order.pricing.total)}</strong>
        </div>
      </div>

      {/* Pre-Dispatch Cancellation & Refund Action Banner */}
      {isCancelled ? (
        <div className={styles.cancelledBanner}>
          <AlertCircle size={16} />
          <span>
            Order Cancelled{order.cancellationReason ? ` (${order.cancellationReason})` : ''} ·{' '}
            {order.paymentStatus === 'refunded' || order.paymentStatus === 'refund_initiated'
              ? `Refund of ${formatCurrency(order.pricing.total)} initiated to your original payment method (5–7 working days SLA).`
              : 'No payment was captured for this order.'}
          </span>
        </div>
      ) : isPreDispatch ? (
        <div className={styles.cancelActionRow}>
          <span className={styles.cancelInfoNotice}>
            Eligible for free pre-dispatch cancellation and immediate refund before dispatch.
          </span>
          {onCancelClick && (
            <button
              type="button"
              onClick={() => onCancelClick(order)}
              className={styles.cancelBtn}
            >
              Cancel Order &amp; Request Refund
            </button>
          )}
        </div>
      ) : (
        <div className={styles.dispatchedNotice}>
          📦 Order is {order.orderStatus === 'shipped' || order.orderStatus === 'processing' ? 'shipped' : order.orderStatus === 'out_for_delivery' ? 'out for delivery' : 'delivered'}. Covered by Sri Ram &amp; Co <strong>3-Day Store Replacement Policy</strong>. Need support? Call +91 93454 03136.
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const [searchId, setSearchId] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);

  // Return Modal State
  const [returnModalData, setReturnModalData] = useState<{
    isOpen: boolean;
    order: Order | null;
    item: OrderItem | null;
  }>({
    isOpen: false,
    order: null,
    item: null,
  });

  // Cancellation Modal State
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('Changed mind / Placed by mistake');
  const [customReason, setCustomReason] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const refreshOrders = useCallback(async (showLoading = false) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('src_auth_token') : null;
    if (!token) {
      setNeedsSignIn(true);
      setOrdersLoading(false);
      return;
    }

    if (showLoading) setOrdersLoading(true);
    try {
      const customerOrders = await api.getMyOrders(token);
      setOrders(customerOrders);
      setOrdersError(null);
    } catch (error: unknown) {
      setOrdersError(error instanceof Error ? error.message : 'Could not load your orders.');
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshOrders(true);

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refreshOrders();
    };
    const intervalId = window.setInterval(() => void refreshOrders(), 15000);
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [refreshOrders]);

  useEffect(() => {
    if (!searchedOrder) return;

    let isMounted = true;
    const refreshTrackedOrder = async () => {
      try {
        const order = await api.getOrderByNumber(searchedOrder.orderNumber);
        if (isMounted) {
          setSearchedOrder(order);
          setSearchError(null);
        }
      } catch (error: unknown) {
        if (isMounted) {
          setSearchError(error instanceof Error ? error.message : 'Could not refresh this order.');
        }
      }
    };

    const intervalId = window.setInterval(() => void refreshTrackedOrder(), 15000);
    window.addEventListener('focus', refreshTrackedOrder);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshTrackedOrder);
    };
  }, [searchedOrder?.orderNumber]);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    try {
      const order = await api.getOrderByNumber(searchId.trim());
      setSearchedOrder(order);
    } catch (error: unknown) {
      setSearchError(error instanceof Error ? error.message : 'Order not found. Please verify the order reference number.');
      setSearchedOrder(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleOpenCancelModal = (order: Order) => {
    setCancelModalOrder(order);
    setCancelReason('Changed mind / Placed by mistake');
    setCustomReason('');
    setGuestPhone('');
    setCancelError(null);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('src_auth_token') || undefined : undefined;
    const finalReason = cancelReason === 'Other' ? customReason.trim() || 'Customer requested pre-dispatch cancellation' : cancelReason;

    setCancelling(true);
    setCancelError(null);

    try {
      const response = await api.cancelOrder(
        cancelModalOrder.id || cancelModalOrder.orderNumber,
        {
          reason: finalReason,
          phone: guestPhone.trim(),
        },
        token
      );

      // Update in state
      const updated = response.order;
      setOrders((prev) => prev.map((o) => (o.orderNumber === updated.orderNumber ? updated : o)));
      if (searchedOrder && searchedOrder.orderNumber === updated.orderNumber) {
        setSearchedOrder(updated);
      }

      setCancelModalOrder(null);
      setSuccessToast(response.message || `Order #${updated.orderNumber} cancelled successfully. Refund initiated.`);
      setTimeout(() => setSuccessToast(null), 8000);
    } catch (err: unknown) {
      setCancelError(err instanceof Error ? err.message : 'Failed to cancel order. Please verify your phone number.');
    } finally {
      setCancelling(false);
    }
  };

  const handleOpenReturnModal = (order: Order, item: OrderItem) => {
    setReturnModalData({
      isOpen: true,
      order,
      item,
    });
  };

  const handleReturnSuccess = (updatedOrder: Order) => {
    setOrders((prev) => prev.map((o) => (o.orderNumber === updatedOrder.orderNumber ? updatedOrder : o)));
    if (searchedOrder && searchedOrder.orderNumber === updatedOrder.orderNumber) {
      setSearchedOrder(updatedOrder);
    }
    setSuccessToast(`Return request submitted for Order #${updatedOrder.orderNumber}. Sri Ram & Co team will inspect and reach out to you within 24-48 hours.`);
    setTimeout(() => setSuccessToast(null), 8000);
  };

  const filteredOrders = activeTab === 'active'
    ? orders.filter((order) => !['delivered', 'cancelled'].includes(order.orderStatus))
    : orders;
  const activeOrderCount = orders.filter(
    (order) => !['delivered', 'cancelled'].includes(order.orderStatus)
  ).length;

  return (
    <div className={styles.ordersPage}>
      <div className={styles.banner}>
        <div className="container">
          <span className="text-eyebrow">Customer Care</span>
          <h1 className="heading-section">Track &amp; View Orders</h1>
          <p className={styles.bannerSubtitle}>
            Monitor your live store delivery or manage orders and pre-dispatch refunds.
          </p>
        </div>
      </div>

      <div className="container">
        {successToast && (
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '24px',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 500,
            }}
          >
            <CheckCircle2 size={20} />
            <span>{successToast}</span>
          </div>
        )}

        <div className={styles.trackCard}>
          <div className={styles.trackContent}>
            <h3>Track Direct Delivery</h3>
            <p>Enter the Order Reference ID received during checkout or via phone confirmation:</p>
          </div>
          <form onSubmit={handleTrackSubmit} className={styles.trackForm}>
            <div className={styles.inputWrapper}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="e.g. SRC-123456"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className={styles.trackInput}
              />
            </div>
            <button type="submit" disabled={searchLoading} className="btn btn-primary">
              {searchLoading ? 'Searching...' : 'Track Status'}
            </button>
          </form>
          {searchError && (
            <p style={{ color: '#DC2626', fontSize: '0.85rem', marginTop: '12px', fontWeight: 500 }}>
              {searchError}
            </p>
          )}
        </div>

        {searchedOrder && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ color: '#174A2B', marginBottom: '12px', fontSize: '1.1rem' }}>
              Live Delivery Status: {searchedOrder.orderNumber}
            </h3>
            <OrderCard
              order={searchedOrder}
              highlighted
              onCancelClick={handleOpenCancelModal}
              onReturnClick={handleOpenReturnModal}
            />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div className={styles.tabsRow} style={{ flex: 1 }}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'all' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Purchases ({orders.length})
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'active' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('active')}
            >
              Live Deliveries ({activeOrderCount})
            </button>
          </div>
          <button
            type="button"
            onClick={() => void refreshOrders(true)}
            disabled={ordersLoading}
            className="btn btn-secondary"
            aria-label="Refresh orders"
          >
            <RefreshCw size={16} className={ordersLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <div className={styles.ordersList}>
          {ordersLoading && <p>Loading your orders...</p>}
          {!ordersLoading && ordersError && (
            <p role="alert" style={{ color: '#DC2626' }}>{ordersError}</p>
          )}
          {!ordersLoading && !ordersError && needsSignIn && (
            <p>
              <Link href="/login" style={{ color: '#174A2B', textDecoration: 'underline', fontWeight: 600 }}>Sign in</Link> to view all orders placed with your account, or track a specific purchase above.
            </p>
          )}
          {!ordersLoading && !ordersError && !needsSignIn && filteredOrders.length === 0 && (
            <p>{activeTab === 'active' ? 'You have no active deliveries.' : 'You have not placed any orders yet.'}</p>
          )}
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id || order.orderNumber}
              order={order}
              onCancelClick={handleOpenCancelModal}
              onReturnClick={handleOpenReturnModal}
            />
          ))}
        </div>
      </div>

{/* Product Return Modal */}
      {returnModalData.isOpen && returnModalData.order && returnModalData.item && (
        <ReturnProductModal
          isOpen={returnModalData.isOpen}
          order={returnModalData.order}
          item={returnModalData.item}
          onClose={() => setReturnModalData({ isOpen: false, order: null, item: null })}
          onSuccess={handleReturnSuccess}
        />
      )}

      {/* Cancellation & Refund Modal */}
      {cancelModalOrder && (
        <div className={styles.modalOverlay} onClick={() => !cancelling && setCancelModalOrder(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Cancel Order &amp; Request Refund</h3>
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setCancelModalOrder(null)}
                className={styles.closeModalBtn}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p>
                You are requesting pre-dispatch cancellation for Order <strong>#{cancelModalOrder.orderNumber}</strong>.
              </p>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reason for cancellation</label>
                <select
                  className={styles.formSelect}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  disabled={cancelling}
                >
                  <option value="Changed mind / Placed by mistake">Changed mind / Placed by mistake</option>
                  <option value="Need to change delivery address or phone">Need to change delivery address or phone</option>
                  <option value="Want to purchase a different appliance / model">Want to purchase a different appliance / model</option>
                  <option value="Found an alternative / duplicate order">Found an alternative / duplicate order</option>
                  <option value="Delivery timeframe does not suit me">Delivery timeframe does not suit me</option>
                  <option value="Other">Other (specify below)</option>
                </select>
              </div>

              {cancelReason === 'Other' && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Please describe the reason</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Enter reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    disabled={cancelling}
                  />
                </div>
              )}

              {needsSignIn && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Verify Checkout Phone Number</label>
                  <input
                    type="tel"
                    className={styles.formInput}
                    placeholder="e.g. 9345403136"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    disabled={cancelling}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Required for unauthenticated guest orders to prevent unauthorized cancellations.
                  </span>
                </div>
              )}

              <div className={styles.refundAlertBox}>
                <strong>Refund Guarantee SLA:</strong>
                <br />
                {cancelModalOrder.paymentStatus === 'paid' ? (
                  <>
                    Full refund of <strong>{formatCurrency(cancelModalOrder.pricing.total)}</strong> will be credited directly back to your original payment method (UPI / Card / Netbanking) within <strong>5–7 working days</strong>.
                  </>
                ) : (
                  <>No payment was captured for this order. No charges will be incurred.</>
                )}
              </div>

              {cancelError && (
                <p role="alert" style={{ color: '#dc2626', fontSize: '0.8125rem', fontWeight: 600 }}>
                  {cancelError}
                </p>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setCancelModalOrder(null)}
                className={styles.keepOrderBtn}
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className={styles.confirmCancelBtn}
              >
                {cancelling ? 'Processing Refund...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
