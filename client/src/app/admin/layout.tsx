'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ExternalLink, ShieldAlert, LogOut } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import styles from './layout.module.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    async function verifyAdminAuth() {
      try {
        const token = localStorage.getItem('src_auth_token');
        const storedUser = localStorage.getItem('src_user');

        if (!token) {
          setIsAdmin(false);
          return;
        }

        // Verify active token against backend
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const user = await res.json();
          if (user.role === 'admin') {
            setIsAdmin(true);
            setAdminUser(user);
            localStorage.setItem('src_user', JSON.stringify(user));
            return;
          }
        }

        // Token expired or invalid
        localStorage.removeItem('src_auth_token');
        localStorage.removeItem('src_user');
        setIsAdmin(false);
      } catch {
        // Network failure or offline: do not allow unverified bypass
        setIsAdmin(false);
      }
    }

    verifyAdminAuth();
  }, [API_BASE]);

  const handleLogout = () => {
    localStorage.removeItem('src_auth_token');
    localStorage.removeItem('src_user');
    setIsAdmin(false);
    window.dispatchEvent(new Event('auth-change'));
    router.push('/f0d06b7799107f8da21a05984c29bb10');
  };

  // While checking local storage
  if (isAdmin === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F7F8F5' }}>
        <p style={{ color: '#174A2B', fontFamily: 'var(--font-poppins)', fontWeight: 600 }}>Loading workspace...</p>
      </div>
    );
  }

  // If unauthorized, show security perimeter notice
  if (!isAdmin) {
    return (
      <div className={styles.adminShell}>
        <div className={styles.mainWrapper}>
          <div className={styles.authGuardCard}>
            <ShieldAlert size={48} color="#174A2B" style={{ margin: '0 auto 16px auto' }} />
            <h2 className={styles.guardTitle}>Admin Access Restricted</h2>
            <p className={styles.guardText}>
              This administrative zone is protected. Please authenticate via your secure administrator gateway.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <Link
                href="/f0d06b7799107f8da21a05984c29bb10"
                style={{
                  display: 'inline-block',
                  backgroundColor: '#174A2B',
                  color: '#FFFFFF',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  textAlign: 'center',
                }}
              >
                Go to Secure Gateway
              </Link>
              <Link href="/" className={styles.loginRedirectLink}>
                Return to Storefront
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Derive admin initials for the avatar badge (e.g. "AR" or "SA")
  const initials = adminUser?.name
    ? adminUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AR';

  const pathname = usePathname();
  let breadcrumbTag = 'CATALOG';
  let pageHeaderTitle = 'Products';

  if (pathname.startsWith('/admin/orders')) {
    breadcrumbTag = 'FULFILLMENT';
    pageHeaderTitle = 'Orders';
  } else if (pathname.startsWith('/admin/emails')) {
    breadcrumbTag = 'NOTIFICATIONS';
    pageHeaderTitle = 'Email Studio';
  } else if (pathname.startsWith('/admin/customers')) {
    breadcrumbTag = 'RELATIONSHIPS';
    pageHeaderTitle = 'Customers';
  } else if (pathname.includes('/new')) {
    breadcrumbTag = 'CATALOG';
    pageHeaderTitle = 'Add Product';
  } else if (pathname.includes('/products/')) {
    breadcrumbTag = 'CATALOG';
    pageHeaderTitle = 'Edit Product';
  }

  return (
    <div className={styles.adminShell}>
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className={styles.mainWrapper}>
        {/* Top Header Bar */}
        <header className={styles.topBar}>
          <div className={styles.breadcrumbGroup}>
            <span className={styles.breadcrumbTag}>{breadcrumbTag}</span>
            <h1 className={styles.pageHeaderTitle}>{pageHeaderTitle}</h1>
          </div>

          <div className={styles.topActions}>
            <Link href="/" target="_blank" className={styles.viewStoreLink}>
              <span>View storefront</span>
              <ExternalLink size={14} />
            </Link>

            <button
              type="button"
              className={styles.headerLogoutBtn}
              onClick={handleLogout}
              title="End administrator session and sign out"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>

            <div
              className={styles.adminAvatar}
              title={`Logged in as ${adminUser?.name || 'Administrator'} (${adminUser?.email || ''})`}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Child Pages */}
        <main className={styles.contentArea}>
          {children}
        </main>
      </div>
    </div>
  );
}
