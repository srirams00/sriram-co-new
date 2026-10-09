'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingBag, Users } from 'lucide-react';
import styles from './AdminSidebar.module.css';

const DASHBOARD_ROUTE = '/48191d90cc476d1c72aaec9997cc977c';

export default function AdminSidebar() {
  const pathname = usePathname();

  const isDashboardActive = pathname.startsWith(DASHBOARD_ROUTE);
  const isProductsActive = pathname.startsWith('/admin/products');

  return (
    <aside className={styles.sidebar}>
      {/* Brand Header */}
      <div className={styles.brandSection}>
        <div className={styles.brandIcon}>S</div>
        <div className={styles.brandMeta}>
          <span className={styles.brandTitle}>Sri Ram &amp; Co</span>
          <span className={styles.brandSubtitle}>Admin workspace</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className={styles.navGroup}>
        <Link
          href={DASHBOARD_ROUTE}
          className={`${styles.navItem} ${isDashboardActive ? styles.navItemActive : ''}`}
        >
          <div className={styles.navItemLeft}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </div>
        </Link>

        <Link
          href="/admin/products"
          className={`${styles.navItem} ${isProductsActive ? styles.navItemActive : ''}`}
        >
          <div className={styles.navItemLeft}>
            <Package size={18} />
            <span>Products</span>
          </div>
        </Link>

        <Link
          href="/admin/orders"
          className={`${styles.navItem} ${pathname.startsWith('/admin/orders') ? styles.navItemActive : ''}`}
        >
          <div className={styles.navItemLeft}>
            <ShoppingBag size={18} />
            <span>Orders</span>
          </div>
          <span className={styles.navBadge}>12</span>
        </Link>

        <Link
          href="/admin/customers"
          className={`${styles.navItem} ${pathname.startsWith('/admin/customers') ? styles.navItemActive : ''}`}
        >
          <div className={styles.navItemLeft}>
            <Users size={18} />
            <span>Customers</span>
          </div>
        </Link>
      </nav>

      {/* Store status footer */}
      <div className={styles.sidebarFooter}>
        <span>Store status</span>
        <div className={styles.statusIndicator}>
          <span className={styles.statusDot}></span>
          <span>Online</span>
        </div>
      </div>
    </aside>
  );
}
