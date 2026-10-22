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
  Mail,
  Send,
  UserCheck,
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Driver Assignment Prompt State (Out for Delivery)
  const [driverModal, setDriverModal] = useState<{ orderId: string; orderNumber: string } | null>(null);
  const [driverName, setDriverName] = useState('Murugan K');
  const [driverPhone, setDriverPhone] = useState('+91 98424 55123');
  const [deliveryWindow, setDeliveryWindow] = useState('Today, 4:00 PM – 6:00 PM');

  // Cancellation Prompt State
  const [cancelModal, setCancelModal] = useState<{ orderId: string; orderNumber: string } | null>(null);
  const [cancellationReason, setCancellationReason] = useState('Customer requested cancellation');
  const [cancelledBy, setCancelledBy] = useState<'store' | 'customer'>('store');

  // Quick Email Modal State (from row button)
  const [quickEmailOrder, setQuickEmailOrder] = useState<Order | null>(null);
  const [sendingEmailKey, setSendingEmailKey] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

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

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus,
    extraData?: {
      driverName?: string;
      driverPhone?: string;
      deliveryWindow?: string;
      cancellationReason?: string;
      cancelledBy?: 'store' | 'customer';
    }
  ) => {
    // Intercept out_for_delivery to capture driver details
    if (newStatus === 'out_for_delivery' && !extraData?.driverName) {
      const order = orders.find((o) => o.id === orderId);
      setDriverModal({ orderId, orderNumber: order?.orderNumber || orderId });
      return;
    }

    // Intercept cancelled to capture reason
    if (newStatus === 'cancelled' && !extraData?.cancellationReason) {
      const order = orders.find((o) => o.id === orderId);
      setCancelModal({ orderId, orderNumber: order?.orderNumber || orderId });
      return;
    }

    setUpdatingId(orderId);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('src_auth_token') || undefined : undefined;
      await api.updateOrderStatus(orderId, newStatus, undefined, extraData, token);
      
      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
      );

      // Trigger reliable Vercel relay email dispatch
      const targetOrder = orders.find((o) => o.id === orderId);
      if (targetOrder) {
        api.sendOrderEmail(orderId, newStatus, extraData, token, { ...targetOrder, orderStatus: newStatus }).catch((e) =>
          console.warn('[Vercel Relay] Background email dispatch error:', e)
        );
      }

      showToast(`Status updated to "${newStatus.replace(/_/g, ' ')}" · Email notification dispatched via Zoho Mail!`);
    } catch (err: any) {
      alert(`Failed to update status: ${err.message || 'Network error'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendManualEmail = async (
    order: Order,
    templateId: string,
    extraData?: {
      driverName?: string;
      driverPhone?: string;
      deliveryWindow?: string;
      cancellationReason?: string;
      cancelledBy?: 'store' | 'customer';
    }
  ) => {
    setSendingEmailKey(`${order.id}-${templateId}`);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('src_auth_token') || undefined : undefined;
      const res = await api.sendOrderEmail(order.id, templateId, extraData, token, order);
      const recipient = order.customerInfo?.email || 'customer mailbox';
      showToast(`Email (${templateId.replace(/_/g, ' ')}) dispatched to ${recipient}!`);
      if (quickEmailOrder) setQuickEmailOrder(null);
    } catch (err: any) {
      showToast(`Failed to send email: ${err.message || 'Network error'}`, 'error');
    } finally {
      setSendingEmailKey(null);
    }
  };

  const getStatusClass = (status: OrderStatus) => {
    switch (status) {
      case 'placed':
      case 'confirmed':
        return styles.statusPlaced;
      case 'shipped':
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

      {toast && (
        <div className={styles.toastBanner} style={toast.type === 'error' ? { background: '#FEE2E2', borderColor: '#FECACA', color: '#B91C1C' } : {}}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{toast.message}</span>
          </div>
          <button type="button" onClick={() => setToast(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={16} />
          </button>
        </div>
      )}

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
            { key: 'placed', label: 'Order Placed' },
            { key: 'shipped', label: 'Shipped' },
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
                        value={order.orderStatus === 'confirmed' ? 'placed' : order.orderStatus === 'processing' ? 'shipped' : order.orderStatus}
                        disabled={updatingId === order.id}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value as OrderStatus)
                        }
                        className={`${styles.statusSelect} ${getStatusClass(order.orderStatus)}`}
                      >
                        <option value="placed">Order Placed</option>
                        <option value="shipped">Shipped</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    <td>
                      <div className={styles.actionGroup}>
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className={styles.actionBtn}
                          title="View complete order breakdown"
                        >
                          <Eye size={13} style={{ display: 'inline', marginRight: '4px' }} />
                          <span>Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickEmailOrder(order)}
                          className={styles.emailBtn}
                          title="Send transactional email via Zoho Mail"
                        >
                          <Mail size={12} />
                          <span>Email</span>
                        </button>
                      </div>
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

              {/* Transactional Notifications (Zoho Mail) */}
              <div className={styles.sectionBox}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className={styles.sectionTitle}>Transactional Notifications (Zoho Mail)</span>
                  <Link href="/admin/emails" style={{ fontSize: '0.76rem', color: '#18A957', fontWeight: 600, textDecoration: 'none' }}>
                    Open Email Studio →
                  </Link>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#4A584E' }}>
                  Recipient:{' '}
                  <strong style={{ color: '#174A2B' }}>
                    {selectedOrder.customerInfo?.email || `${selectedOrder.customerInfo?.phone || 'customer'}@customer.sriramandco.in`}
                  </strong>
                </p>
                <div className={styles.emailGrid}>
                  {[
                    { id: 'placed', label: '1. Order Placed', desc: 'Order received receipt' },
                    { id: 'shipped', label: '2. Shipped', desc: 'Order dispatched from store' },
                    { id: 'out_for_delivery', label: '3. Out for Delivery', desc: 'Driver & window' },
                    { id: 'delivered', label: '4. Delivered', desc: 'Completion receipt' },
                    { id: 'cancelled', label: 'Cancelled', desc: 'Cancellation notice' },
                  ].map((tpl) => {
                    const isSending = sendingEmailKey === `${selectedOrder.id}-${tpl.id}`;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        disabled={!!sendingEmailKey}
                        onClick={() => handleSendManualEmail(selectedOrder, tpl.id, {
                          driverName,
                          driverPhone,
                          deliveryWindow,
                          cancellationReason,
                          cancelledBy
                        })}
                        className={styles.emailGridBtn}
                      >
                        <span className={styles.emailGridBtnTitle}>
                          {isSending ? <RefreshCw size={13} className="animate-spin" /> : <Send size={12} />}
                          {tpl.label}
                        </span>
                        <span className={styles.emailGridBtnDesc}>{tpl.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Driver Assignment Prompt Modal (Out for Delivery) */}
      {driverModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.promptDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <h3 className={styles.dialogTitle}>Assign Delivery Driver</h3>
              <button type="button" onClick={() => setDriverModal(null)} className={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <p className={styles.dialogDescription}>
              Order #{driverModal.orderNumber} will be marked as <strong>Out for Delivery</strong> and a tracking email will be sent to the customer with these driver details.
            </p>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Driver Name</label>
              <input
                type="text"
                className={styles.formInput}
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. Murugan K"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Driver Contact Phone</label>
              <input
                type="text"
                className={styles.formInput}
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="e.g. +91 98424 55123"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Estimated Delivery Window</label>
              <input
                type="text"
                className={styles.formInput}
                value={deliveryWindow}
                onChange={(e) => setDeliveryWindow(e.target.value)}
                placeholder="e.g. Today, 4:00 PM – 6:00 PM"
              />
            </div>

            <div className={styles.dialogFooter}>
              <button
                type="button"
                onClick={() => setDriverModal(null)}
                className={styles.secondaryBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingId === driverModal.orderId}
                onClick={async () => {
                  const m = driverModal;
                  setDriverModal(null);
                  await handleStatusChange(m.orderId, 'out_for_delivery', {
                    driverName,
                    driverPhone,
                    deliveryWindow,
                  });
                }}
                className={styles.primaryBtn}
              >
                <Truck size={14} />
                <span>Dispatch &amp; Send Email</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Prompt Modal */}
      {cancelModal && (
        <div className={styles.modalOverlay} onClick={() => setCancelModal(null)}>
          <div className={styles.promptDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <h3 className={styles.dialogTitle}>Confirm Order Cancellation</h3>
              <button type="button" onClick={() => setCancelModal(null)} className={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <p className={styles.dialogDescription}>
              Order #{cancelModal.orderNumber} will be cancelled. A cancellation email with refund guidance will be sent to the customer.
            </p>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Cancelled By</label>
              <select
                className={styles.formInput}
                value={cancelledBy}
                onChange={(e) => setCancelledBy(e.target.value as 'store' | 'customer')}
              >
                <option value="store">Store (Stock / Delivery issue)</option>
                <option value="customer">Customer Request</option>
              </select>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Reason for Cancellation</label>
              <input
                type="text"
                className={styles.formInput}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g. Customer requested cancellation before dispatch"
              />
            </div>

            <div className={styles.dialogFooter}>
              <button
                type="button"
                onClick={() => setCancelModal(null)}
                className={styles.secondaryBtn}
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={updatingId === cancelModal.orderId}
                onClick={async () => {
                  const m = cancelModal;
                  setCancelModal(null);
                  await handleStatusChange(m.orderId, 'cancelled', {
                    cancellationReason,
                    cancelledBy,
                  });
                }}
                className={styles.primaryBtn}
                style={{ backgroundColor: '#DC2626' }}
              >
                <AlertCircle size={14} />
                <span>Cancel Order &amp; Notify</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Email Template Modal */}
      {quickEmailOrder && (
        <div className={styles.modalOverlay} onClick={() => setQuickEmailOrder(null)}>
          <div className={styles.promptDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <div>
                <h3 className={styles.dialogTitle}>Send Email · #{quickEmailOrder.orderNumber}</h3>
                <span style={{ fontSize: '0.8rem', color: '#68786D' }}>
                  To: {quickEmailOrder.customerInfo?.email || `${quickEmailOrder.customerInfo?.phone}@customer.sriramandco.in`}
                </span>
              </div>
              <button type="button" onClick={() => setQuickEmailOrder(null)} className={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.emailGrid}>
              {[
                { id: 'placed', label: '1. Order Placed', desc: 'Order received receipt' },
                { id: 'shipped', label: '2. Shipped', desc: 'Order dispatched from store' },
                { id: 'out_for_delivery', label: '3. Out for Delivery', desc: 'Driver & window' },
                { id: 'delivered', label: '4. Delivered', desc: 'Completion receipt' },
                { id: 'cancelled', label: 'Cancelled', desc: 'Cancellation notice' },
              ].map((tpl) => {
                const isSending = sendingEmailKey === `${quickEmailOrder.id}-${tpl.id}`;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    disabled={!!sendingEmailKey}
                    onClick={() => handleSendManualEmail(quickEmailOrder, tpl.id, {
                      driverName,
                      driverPhone,
                      deliveryWindow,
                      cancellationReason,
                      cancelledBy
                    })}
                    className={styles.emailGridBtn}
                  >
                    <span className={styles.emailGridBtnTitle}>
                      {isSending ? <RefreshCw size={13} className="animate-spin" /> : <Send size={12} />}
                      {tpl.label}
                    </span>
                    <span className={styles.emailGridBtnDesc}>{tpl.desc}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.dialogFooter}>
              <button
                type="button"
                onClick={() => setQuickEmailOrder(null)}
                className={styles.secondaryBtn}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
