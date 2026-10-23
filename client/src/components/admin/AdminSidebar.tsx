'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingBag, Users, LogOut, MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';
import styles from './AdminSidebar.module.css';

const DASHBOARD_ROUTE = '/admin';
const ADMIN_LOGIN_ROUTE = '/f0d06b7799107f8da21a05984c29bb10';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [orderCount, setOrderCount] = useState<number | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const fetchOrderCount = async () => {
      try {
        const token = localStorage.getItem('src_auth_token') || undefined;
        const { stats } = await api.getAdminOrders(token);
        if (isCurrent) setOrderCount(stats.totalOrders);
      } catch (error) {
        console.error('Failed to fetch sidebar order count:', error);
      }
    };

    fetchOrderCount();
    return () => {
      isCurrent = false;
    };
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('src_auth_token');
    localStorage.removeItem('src_user');
    window.dispatchEvent(new Event('auth-change'));
    router.push(ADMIN_LOGIN_ROUTE);
  };

  const isDashboardActive = pathname === DASHBOARD_ROUTE;
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
          {orderCount !== null && <span className={styles.navBadge}>{orderCount}</span>}
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

        <Link
          href="/admin/reviews"
          className={`${styles.navItem} ${pathname.startsWith('/admin/reviews') ? styles.navItemActive : ''}`}
        >
          <div className={styles.navItemLeft}>
            <MessageSquare size={18} />
            <span>Reviews</span>
          </div>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className={styles.sidebarLogoutBtn}
          title="Sign out of admin session"
        >
          <div className={styles.navItemLeft}>
            <LogOut size={18} />
            <span>Log Out</span>
          </div>
        </button>
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
