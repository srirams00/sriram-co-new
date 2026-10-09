'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Package,
  PlusCircle,
  ExternalLink,
  LogOut,
  Database,
  ShoppingBag,
  Activity,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import styles from './admin-dashboard.module.css';

const AUTH_ROUTE = '/f0d06b7799107f8da21a05984c29bb10';

export default function AdminSecretDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [dbStatus, setDbStatus] = useState<string>('Checking...');

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    async function verifyAndLoadDashboard() {
      try {
        const token = localStorage.getItem('src_auth_token');
        if (!token) {
          router.replace(AUTH_ROUTE);
          return;
        }

        // Verify token & admin clearance
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          localStorage.removeItem('src_auth_token');
          localStorage.removeItem('src_user');
          router.replace(AUTH_ROUTE);
          return;
        }

        const user = await res.json();
        if (user.role !== 'admin') {
          router.replace(AUTH_ROUTE);
          return;
        }

        setAdminUser(user);

        // Fetch live product count from database
        try {
          const prodRes = await fetch(`${API_BASE}/products`);
          if (prodRes.ok) {
            const prodData = await prodRes.json();
            const count = Array.isArray(prodData)
              ? prodData.length
              : prodData.products?.length || 0;
            setProductCount(count);
            setDbStatus('Operational');
          } else {
            setDbStatus('Degraded');
          }
        } catch {
          setDbStatus('Offline');
        }
      } catch {
        router.replace(AUTH_ROUTE);
      } finally {
        setLoading(false);
      }
    }

    verifyAndLoadDashboard();
  }, [API_BASE, router]);

  const handleLogout = () => {
    localStorage.removeItem('src_auth_token');
    localStorage.removeItem('src_user');
    router.replace(AUTH_ROUTE);
  };

  if (loading) {
    return (
      <div className={styles.dashboardContainer} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#174A2B', fontWeight: 600 }}>
          <Loader2 className={styles.spinner} size={24} />
          <span>Validating administrator session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* Top Navbar */}
      <header className={styles.topBar}>
        <div className={styles.brandGroup}>
          <div className={styles.logoBadge}>S</div>
          <span className={styles.brandTitle}>Sri Ram &amp; Co Admin</span>
          <div className={styles.securityPill}>
            <ShieldCheck size={14} />
            <span>32-Char Secret Gateway</span>
          </div>
        </div>

        <div className={styles.topActions}>
          <span className={styles.userBadge}>
            {adminUser?.email || 'admin@sriramandco.com'}
          </span>
          <button onClick={handleLogout} className={styles.logoutBtn} title="Sign Out">
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Welcome Section */}
        <section className={styles.headerSection}>
          <h1 className={styles.greeting}>Administrator Dashboard</h1>
          <p className={styles.subGreeting}>
            Direct management interface protected by cryptographically isolated routes.
          </p>
        </section>

        {/* Real-time Metrics Grid */}
        <section className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <span>Catalog Size</span>
              <Package size={18} />
            </div>
            <div className={styles.metricValue}>
              {productCount !== null ? productCount : '...'}
            </div>
            <div className={styles.metricSubtext}>Live products in MongoDB</div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <span>Database Connection</span>
              <Database size={18} />
            </div>
            <div className={styles.metricValue} style={{ fontSize: '1.25rem', color: '#18A957' }}>
              {dbStatus}
            </div>
            <div className={styles.metricSubtext}>MongoDB Atlas Cluster</div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <span>Security Perimeter</span>
              <ShieldCheck size={18} />
            </div>
            <div className={styles.metricValue} style={{ fontSize: '1.25rem', color: '#174A2B' }}>
              Isolated
            </div>
            <div className={styles.metricSubtext}>32-character dual slugs active</div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <span>Storefront Status</span>
              <Activity size={18} />
            </div>
            <div className={styles.metricValue} style={{ fontSize: '1.25rem', color: '#18A957' }}>
              Live
            </div>
            <div className={styles.metricSubtext}>Accepting consumer orders</div>
          </div>
        </section>

        {/* Core Administrative Actions */}
        <section className={styles.actionSection}>
          <h2 className={styles.sectionHeading}>Management Tools</h2>
          <div className={styles.cardGrid}>
            <Link href="/admin/products" className={styles.actionCard}>
              <div className={styles.actionCardIcon}>
                <Package size={22} />
              </div>
              <h3 className={styles.actionCardTitle}>Manage Products</h3>
              <p className={styles.actionCardDesc}>
                Edit stock, update prices, add descriptions, and organize categories in real-time.
              </p>
              <div className={styles.actionCardLink}>
                <span>Open Product Table</span>
                <ArrowRight size={14} />
              </div>
            </Link>

            <Link href="/admin/products/new" className={styles.actionCard}>
              <div className={styles.actionCardIcon}>
                <PlusCircle size={22} />
              </div>
              <h3 className={styles.actionCardTitle}>Add New Product</h3>
              <p className={styles.actionCardDesc}>
                Publish new artisanal products, specify specifications, and upload imagery.
              </p>
              <div className={styles.actionCardLink}>
                <span>Create Product</span>
                <ArrowRight size={14} />
              </div>
            </Link>

            <Link href="/" target="_blank" className={styles.actionCard}>
              <div className={styles.actionCardIcon}>
                <ExternalLink size={22} />
              </div>
              <h3 className={styles.actionCardTitle}>Storefront View</h3>
              <p className={styles.actionCardDesc}>
                Preview the customer-facing storefront live with full catalog visibility.
              </p>
              <div className={styles.actionCardLink}>
                <span>Open in New Tab</span>
                <ExternalLink size={14} />
              </div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
