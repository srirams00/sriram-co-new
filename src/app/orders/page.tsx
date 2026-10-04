'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Package, Search, Truck, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import styles from './orders.module.css';

const MOCK_ORDERS = [
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
  const [activeTab, setActiveTab] = useState<'all' | 'active'>('all');

  const filteredOrders = activeTab === 'active' 
    ? MOCK_ORDERS.filter(o => o.status !== 'Delivered') 
    : MOCK_ORDERS;

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
          <div className={styles.trackForm}>
            <div className={styles.inputWrapper}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="e.g. SRC-982341"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className={styles.trackInput}
              />
            </div>
            <button type="button" className="btn btn-primary">
              Track Status
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className={styles.tabsRow}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'all' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Purchases ({MOCK_ORDERS.length})
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
