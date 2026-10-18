'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Search } from 'lucide-react';
import { formatCurrency, getOptimizedImageUrl } from '@/lib/utils';
import { api } from '@/lib/api';
import { Order, OrderStatus } from '@/types/order';
import styles from './orders.module.css';

const ORDER_STEPS = ['Order Placed', 'Confirmed', 'Processing', 'Out for Delivery', 'Delivered'];

function getStatusLabel(status: OrderStatus): string {
  if (status === 'out_for_delivery') return 'Out for Delivery';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') return null;

  const currentStep = {
    placed: 0,
    confirmed: 1,
    processing: 2,
    out_for_delivery: 3,
    delivered: 4,
    cancelled: -1,
  }[status];

  return (
    <div className={styles.timeline} aria-label={`Order progress: ${getStatusLabel(status)}`}>
      {ORDER_STEPS.map((step, index) => {
        const processingIsComplete = status === 'processing' && index === currentStep;
        const isDone = status === 'delivered' || index < currentStep || processingIsComplete;
        const isCurrent = index === currentStep && status !== 'delivered' && !processingIsComplete;

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

function OrderCard({ order, highlighted = false }: { order: Order; highlighted?: boolean }) {
  const isDelivered = order.orderStatus === 'delivered';
  const isCancelled = order.orderStatus === 'cancelled';

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
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN')} · {order.paymentMethod === 'razorpay' ? 'Online (Razorpay)' : order.paymentMethod.toUpperCase()} · <strong style={{ color: order.paymentStatus === 'paid' ? '#16a34a' : '#d97706' }}>{order.paymentStatus === 'paid' ? '✓ Paid' : order.paymentStatus.toUpperCase()}</strong>
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
            style={isCancelled ? { color: '#DC2626' } : undefined}
          >
            {isDelivered ? '✓ ' : isCancelled ? '' : '🚚 '}
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

  const refreshOrders = useCallback(async (showLoading = false) => {
    const token = localStorage.getItem('src_auth_token');
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
            Monitor your live store delivery or inspect past purchase invoices.
          </p>
        </div>
      </div>

      <div className="container">
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
            <OrderCard order={searchedOrder} highlighted />
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
              <Link href="/login">Sign in</Link> to view the orders placed with your account.
            </p>
          )}
          {!ordersLoading && !ordersError && !needsSignIn && filteredOrders.length === 0 && (
            <p>{activeTab === 'active' ? 'You have no active deliveries.' : 'You have not placed any orders yet.'}</p>
          )}
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </div>
    </div>
  );
}
