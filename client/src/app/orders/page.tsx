'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Package, Search, Truck, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';
import styles from './orders.module.css';

const DEMO_ORDERS = [
  {
    id: 'SRC-982341',
    date: 'Oct 02, 2026',
    status: 'Out for Delivery',
    statusStep: 3,
    branch: 'Trichy Main Store',
    total: 14499,
    items: [
      {
        name: 'Cordless Robot Vacuum Cleaner Pro',
        qty: 1,
        price: 14499,
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
      },
    ],
    address: '18, Salai Road, Thillai Nagar, Trichy - 620018',
    deliveryDriver: 'Senthil (Sriram & Co Staff Dispatch)',
    driverPhone: '+91 94432 11002',
  },
  {
    id: 'SRC-765109',
    date: 'Sep 18, 2026',
    status: 'Delivered',
    statusStep: 4,
    branch: 'Chennai Experience Store',
    total: 4200,
    items: [
      {
        name: 'Precision Pour-Over Coffee Station',
        qty: 1,
        price: 4200,
        image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=400&q=80',
      },
    ],
    address: 'Flat 3B, Sri Krishna Apts, Adyar, Chennai - 600020',
  },
];

export default function OrdersPage() {
  const [searchId, setSearchId] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<any | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active'>('all');

  const handleTrackSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchId.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    try {
      const order = await api.getOrderByNumber(searchId.trim());
      setSearchedOrder(order);
    } catch (err: any) {
      setSearchError(err.message || 'Order not found. Please verify the order reference number.');
      setSearchedOrder(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const filteredOrders = activeTab === 'active' 
    ? DEMO_ORDERS.filter(o => o.status !== 'Delivered') 
    : DEMO_ORDERS;

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
        {/* Track by Order ID Card */}
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

        {/* Live Searched Order Result Card */}
        {searchedOrder && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ color: '#174A2B', marginBottom: '12px', fontSize: '1.1rem' }}>
              🎯 Live Delivery Status: {searchedOrder.orderNumber}
            </h3>
            <div className={styles.orderCard} style={{ border: '2px solid #18A957' }}>
              <div className={styles.orderHeader}>
                <div>
                  <span className={styles.orderRef}>Order Ref: <strong>{searchedOrder.orderNumber}</strong></span>
                  <span className={styles.orderDate}>
                    Placed on {new Date(searchedOrder.createdAt).toLocaleDateString('en-IN')} • Payment: {searchedOrder.paymentMethod.toUpperCase()}
                  </span>
                </div>
                <div className={styles.statusBadge}>
                  <span className={styles.badgeActive} style={{ textTransform: 'capitalize' }}>
                    🚚 {searchedOrder.orderStatus.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Dynamic Timeline */}
              <div className={styles.timeline}>
                <div className={`${styles.timelineStep} ${styles.stepDone}`}>
                  <div className={styles.dot}>✓</div>
                  <span>Order Placed</span>
                </div>
                <div className={styles.timelineLine} />
                <div className={`${styles.timelineStep} ${['confirmed', 'processing', 'out_for_delivery', 'delivered'].includes(searchedOrder.orderStatus) ? styles.stepDone : ''}`}>
                  <div className={styles.dot}>{['confirmed', 'processing', 'out_for_delivery', 'delivered'].includes(searchedOrder.orderStatus) ? '✓' : '2'}</div>
                  <span>Phone Confirmed</span>
                </div>
                <div className={styles.timelineLine} />
                <div className={`${styles.timelineStep} ${['out_for_delivery', 'delivered'].includes(searchedOrder.orderStatus) ? styles.stepDone : searchedOrder.orderStatus === 'processing' ? styles.stepCurrent : ''}`}>
                  <div className={styles.dot}>{['out_for_delivery', 'delivered'].includes(searchedOrder.orderStatus) ? '✓' : '3'}</div>
                  <span>Out for Delivery</span>
                </div>
                <div className={styles.timelineLine} />
                <div className={`${styles.timelineStep} ${searchedOrder.orderStatus === 'delivered' ? styles.stepDone : ''}`}>
                  <div className={styles.dot}>{searchedOrder.orderStatus === 'delivered' ? '✓' : '4'}</div>
                  <span>Delivered</span>
                </div>
              </div>

              {/* Items */}
              <div className={styles.itemsBlock}>
                {searchedOrder.orderItems?.map((item: any, idx: number) => (
                  <div key={idx} className={styles.itemRow}>
                    <img src={item.image} alt={item.name} className={styles.itemImg} />
                    <div className={styles.itemInfo}>
                      <h4>{item.name}</h4>
                      <p>Quantity: {item.quantity}</p>
                    </div>
                    <strong className={styles.itemPrice}>{formatCurrency(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className={styles.orderFooter}>
                <div className={styles.footerAddress}>
                  <strong>Deliver to:</strong> {searchedOrder.customerInfo?.address}, {searchedOrder.customerInfo?.city}
                </div>
                <div className={styles.footerTotal}>
                  <span>Total Amount:</span>
                  <strong>{formatCurrency(searchedOrder.pricing?.total || 0)}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Controls */}
        <div className={styles.tabsRow}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'all' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Purchases ({DEMO_ORDERS.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'active' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Live Deliveries (1)
          </button>
        </div>

        {/* Orders List */}
        <div className={styles.ordersList}>
          {filteredOrders.map((order) => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div>
                  <span className={styles.orderRef}>Order Ref: <strong>{order.id}</strong></span>
                  <span className={styles.orderDate}>Placed on {order.date} • Dispatched from {order.branch}</span>
                </div>
                <div className={styles.statusBadge}>
                  {order.status === 'Delivered' ? (
                    <span className={styles.badgeDelivered}>✓ Delivered</span>
                  ) : (
                    <span className={styles.badgeActive}>🚚 {order.status}</span>
                  )}
                </div>
              </div>

              {/* Progress Steps for Active Deliveries */}
              {order.status !== 'Delivered' && (
                <div className={styles.timeline}>
                  <div className={`${styles.timelineStep} ${styles.stepDone}`}>
                    <div className={styles.dot}>✓</div>
                    <span>Order Placed</span>
                  </div>
                  <div className={styles.timelineLine} />
                  <div className={`${styles.timelineStep} ${styles.stepDone}`}>
                    <div className={styles.dot}>✓</div>
                    <span>Phone Confirmed</span>
                  </div>
                  <div className={styles.timelineLine} />
                  <div className={`${styles.timelineStep} ${styles.stepCurrent}`}>
                    <div className={styles.dot}>3</div>
                    <span>Out for Delivery</span>
                  </div>
                  <div className={styles.timelineLine} />
                  <div className={styles.timelineStep}>
                    <div className={styles.dot}>4</div>
                    <span>Delivered</span>
                  </div>
                </div>
              )}

              {/* Items */}
              <div className={styles.itemsBlock}>
                {order.items.map((item, idx) => (
                  <div key={idx} className={styles.itemRow}>
                    <img src={item.image} alt={item.name} className={styles.itemImg} />
                    <div className={styles.itemInfo}>
                      <h4>{item.name}</h4>
                      <p>Quantity: {item.qty}</p>
                    </div>
                    <strong className={styles.itemPrice}>{formatCurrency(item.price)}</strong>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className={styles.orderFooter}>
                <div className={styles.footerAddress}>
                  <strong>Delivered to:</strong> {order.address}
                  {order.driverPhone && (
                    <span className={styles.driverNote}>
                      Delivery Staff: {order.deliveryDriver} (<a href={`tel:${order.driverPhone}`}>{order.driverPhone}</a>)
                    </span>
                  )}
                </div>

                <div className={styles.footerTotal}>
                  <span>Total Paid:</span>
                  <strong>{formatCurrency(order.total)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
