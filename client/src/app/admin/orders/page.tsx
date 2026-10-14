'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  Search,
  RefreshCw,
  Eye,
  X,
  Phone,
  MapPin,
  CreditCard,
  Truck,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Order, OrderStatus, OrderStats } from '@/types/order';
import styles from './orders.module.css';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingCount: 0,
    deliveredCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('src_auth_token') || undefined : undefined;
      const res = await api.getAdminOrders(token, activeStatus, searchQuery);
      if (res) {
        setOrders(res.orders || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('src_auth_token') || undefined : undefined;
      const updated = await api.updateOrderStatus(orderId, newStatus, undefined, token);
      
      // Update local state optimistically
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, orderStatus: newStatus } : null));
      }
    } catch (err: any) {
      alert(`Failed to update status: ${err.message || 'Network error'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusClass = (status: OrderStatus) => {
    switch (status) {
      case 'placed':
        return styles.statusPlaced;
      case 'confirmed':
        return styles.statusConfirmed;
      case 'processing':
        return styles.statusProcessing;
      case 'out_for_delivery':
        return styles.statusOutForDelivery;
      case 'delivered':
        return styles.statusDelivered;
      case 'cancelled':
        return styles.statusCancelled;
      default:
        return '';
    }
  };

  return (
    <div className={styles.ordersContainer}>
      {/* Page Header */}
      <div className={styles.ordersHeader}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>Orders Fulfillment</h2>
          <span className={styles.subtitle}>
            Monitor online purchases, assign dispatch drivers, and update order statuses.
          </span>
        </div>
        <div className={styles.headerActions}>
          <button type="button" onClick={fetchOrders} className={styles.refreshBtn}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: '#FEECEC', color: '#DC2626', padding: '12px 16px', borderRadius: '10px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* KPI Metrics */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>Total Orders</span>
            <div className={styles.kpiIconWrapper}>
              <ShoppingBag size={18} />
            </div>
          </div>
          <span className={styles.kpiValue}>{stats.totalOrders}</span>
          <span className={styles.kpiSubtext}>Lifetime customer orders</span>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>Total Revenue</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#EBF8F1', color: '#16A34A' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <span className={styles.kpiValue}>{formatCurrency(stats.totalRevenue)}</span>
          <span className={styles.kpiSubtext}>Gross volume processed</span>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>Pending Dispatch</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
              <Clock size={18} />
            </div>
          </div>
          <span className={styles.kpiValue}>{stats.pendingCount}</span>
          <span className={styles.kpiSubtext}>Requires confirmation / dispatch</span>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>Delivered</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <span className={styles.kpiValue}>{stats.deliveredCount}</span>
          <span className={styles.kpiSubtext}>Completed handoffs</span>
        </div>
      </div>

      {/* Controls Bar: Search & Status Filters */}
      <div className={styles.controlsBar}>
        <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search order ref, customer, phone, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </form>

        <div className={styles.statusTabs}>
          {[
            { key: 'all', label: 'All Orders' },
            { key: 'placed', label: 'Placed' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'processing', label: 'Processing' },
            { key: 'out_for_delivery', label: 'Out for Delivery' },
            { key: 'delivered', label: 'Delivered' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`${styles.statusTab} ${activeStatus === tab.key ? styles.statusTabActive : ''}`}
              onClick={() => setActiveStatus(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Data Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#68786D' }}>
            Loading orders catalog...
          </div>
        ) : orders.length === 0 ? (
          <div className={styles.emptyState}>
            <ShoppingBag size={42} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
            <p style={{ fontWeight: 600, color: '#174A2B' }}>No orders found</p>
            <span style={{ fontSize: '0.84rem' }}>
              No orders matched the current filter or search query.
            </span>
          </div>
        ) : (
          <table className={styles.ordersTable}>
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const firstItem = order.orderItems?.[0];
                const moreCount = (order.orderItems?.length || 1) - 1;

                return (
                  <tr key={order.id} className={styles.orderRow}>
                    <td>
                      <span
                        className={styles.orderRefLink}
                        onClick={() => setSelectedOrder(order)}
                      >
                        {order.orderNumber}
                      </span>
                      <span className={styles.orderDate}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </td>

                    <td>
                      <div className={styles.customerMeta}>
                        <span className={styles.customerName}>{order.customerInfo?.name}</span>
                        <span className={styles.customerPhone}>{order.customerInfo?.phone}</span>
                        <span className={styles.customerCity}>{order.customerInfo?.city}</span>
                      </div>
                    </td>

                    <td>
                      <div className={styles.itemsSummary}>
                        {firstItem && (
                          <img
                            src={firstItem.image}
                            alt={firstItem.name}
                            className={styles.itemThumb}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=100&q=80';
                            }}
                          />
                        )}
                        <div>
                          <span style={{ fontSize: '0.84rem', fontWeight: 600, display: 'block' }}>
                            {firstItem?.name ? (firstItem.name.length > 25 ? `${firstItem.name.slice(0, 25)}...` : firstItem.name) : 'Product'}
                          </span>
                          {moreCount > 0 && (
                            <span className={styles.itemsCountBadge}>+{moreCount} more</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={styles.orderTotal}>
                        {formatCurrency(order.pricing?.total || 0)}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`${styles.paymentBadge} ${
                          order.paymentMethod === 'card' ? styles.paymentCard : styles.paymentUpi
                        }`}
                      >
                        {order.paymentMethod === 'razorpay' ? 'Razorpay Online' : order.paymentMethod}
                      </span>
                      {order.razorpayPaymentId && (
                        <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748b', marginTop: '3px' }}>
                          Ref: <code>{order.razorpayPaymentId}</code>
                        </span>
                      )}
                    </td>

                    <td>
                      <select
                        value={order.orderStatus}
                        disabled={updatingId === order.id}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value as OrderStatus)
                        }
                        className={`${styles.statusSelect} ${getStatusClass(order.orderStatus)}`}
                      >
                        <option value="placed">Placed</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className={styles.actionBtn}
                      >
                        <Eye size={13} style={{ display: 'inline', marginRight: '4px' }} />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Details Modal Popup */}
      {selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Order #{selectedOrder.orderNumber}</h3>
                <span style={{ fontSize: '0.8rem', color: '#68786D' }}>
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className={styles.closeBtn}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Delivery Address Box */}
              <div className={styles.sectionBox}>
                <span className={styles.sectionTitle}>Customer Delivery Info</span>
                <p style={{ margin: 0, fontWeight: 600, color: '#174A2B' }}>
                  {selectedOrder.customerInfo?.name}
                </p>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#68786D' }}>
                  <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {selectedOrder.customerInfo?.address}, {selectedOrder.customerInfo?.city} - {selectedOrder.customerInfo?.postalCode || '620001'}
                </p>
                <p style={{ margin: 0, fontSize: '0.84rem' }}>
                  <Phone size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  <a href={`tel:${selectedOrder.customerInfo?.phone}`} style={{ color: '#18A957', fontWeight: 600, textDecoration: 'none' }}>
                    {selectedOrder.customerInfo?.phone}
                  </a>
                </p>
                {selectedOrder.customerInfo?.notes && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#B45309', background: '#FEF3C7', padding: '6px 10px', borderRadius: '6px' }}>
                    Note: {selectedOrder.customerInfo.notes}
                  </p>
                )}
              </div>

              {/* Items List */}
              <div>
                <span className={styles.sectionTitle}>Ordered Products</span>
                <div className={styles.modalItemsList}>
                  {selectedOrder.orderItems?.map((item, idx) => (
                    <div key={idx} className={styles.modalItemRow}>
                      <img
                        src={item.image}
                        alt={item.name}
                        className={styles.modalItemThumb}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=100&q=80';
                        }}
                      />
                      <div className={styles.modalItemInfo}>
                        <span className={styles.modalItemName}>{item.name}</span>
                        <span className={styles.modalItemQty}>Quantity: {item.quantity}</span>
                      </div>
                      <span className={styles.modalItemPrice}>
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className={styles.sectionBox}>
                <span className={styles.sectionTitle}>Financial Breakdown</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>Subtotal:</span>
                  <strong>{formatCurrency(selectedOrder.pricing?.subtotal || 0)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>Delivery Fee:</span>
                  <span>{selectedOrder.pricing?.deliveryFee ? formatCurrency(selectedOrder.pricing.deliveryFee) : 'Free (Store Delivery)'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>Payment Gateway:</span>
                  <span>{selectedOrder.paymentMethod === 'razorpay' ? 'Razorpay (Online)' : selectedOrder.paymentMethod.toUpperCase()}</span>
                </div>
                {selectedOrder.razorpayPaymentId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>Razorpay Payment ID:</span>
                    <code>{selectedOrder.razorpayPaymentId}</code>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', borderTop: '1px solid #E5EDE7', paddingTop: '8px', color: '#174A2B' }}>
                  <strong>Total Paid:</strong>
                  <strong style={{ color: '#18A957' }}>{formatCurrency(selectedOrder.pricing?.total || 0)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
