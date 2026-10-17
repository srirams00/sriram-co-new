'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import styles from './admin-login.module.css';

const DASHBOARD_ROUTE = '/48191d90cc476d1c72aaec9997cc977c';

export default function AdminSecretLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyingSession, setVerifyingSession] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    async function checkExistingAuth() {
      try {
        const token = localStorage.getItem('src_auth_token');
        if (!token) {
          setVerifyingSession(false);
          return;
        }

        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const user = await res.json();
          if (user.role === 'admin') {
            router.replace(DASHBOARD_ROUTE);
            return;
          }
        }
      } catch {
        // Continue to login
      } finally {
        setVerifyingSession(false);
      }
    }

    checkExistingAuth();
  }, [API_BASE, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your work email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || data.message || 'Invalid administrator credentials');
      }

      if (data.user?.role !== 'admin') {
        throw new Error('Access denied. Administrator clearance required to access this portal.');
      }

      if (data.token) {
        localStorage.setItem('src_auth_token', data.token);
        localStorage.setItem('src_user', JSON.stringify(data.user));
      }

      router.replace(DASHBOARD_ROUTE);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (verifyingSession) {
    return (
      <div className={styles.pageWrapper}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#174A2B', fontWeight: 600 }}>
          <Loader2 className={styles.spinner} size={22} />
          <span>Validating credentials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.authContainer}>
        {/* Left Green Brand Panel */}
        <section className={styles.brandPanel}>
          {/* Subtle concentric rings */}
          <div className={styles.decorRingTop} />
          <div className={styles.decorRingBottom} />

          {/* Top Brand Logo */}
          <div className={styles.brandHeader}>
            <div className={styles.brandAvatar}>S</div>
            <span className={styles.brandName}>
              Sri Ram <span className={styles.brandNameAccent}>&amp; Co.</span>
            </span>
          </div>

          {/* Central Hero Headline */}
          <div className={styles.brandCenter}>
            <div className={styles.opsPill}>
              <Sparkles size={13} />
              <span>Operations Portal</span>
            </div>
            <h1 className={styles.heroHeadline}>
              Run the store
              <br />
              with clarity.
            </h1>
            <p className={styles.heroTagline}>
              Manage products, inventory, and the everyday details that keep Sri Ram &amp; Co. moving.
            </p>
          </div>

          {/* Bottom Security Footer */}
          <div className={styles.brandFooter}>
            <ShieldCheck size={16} className={styles.shieldIcon} />
            <span>Secure workspace for store administrators</span>
          </div>
        </section>

        {/* Right Form Panel */}
        <section className={styles.formPanel}>
          <div className={styles.formHeader}>
            <span className={styles.adminPill}>Admin Access</span>
            <h2 className={styles.welcomeTitle}>Welcome back.</h2>
            <p className={styles.welcomeSubtitle}>Sign in to manage your product catalog.</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {error && (
              <div className={styles.errorBanner} role="alert">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label htmlFor="admin-email" className={styles.label}>
                Work email
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="admin-email"
                  type="email"
                  className={styles.input}
                  placeholder="admin@sriramandco.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="admin-password" className={styles.label}>
                Password
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className={styles.rememberRow}>
              <label className={styles.rememberGroup}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <a
                href="mailto:ramkumar@sriramandco.in?subject=Admin%20Password%20Reset%20Request"
                className={styles.forgotLink}
              >
                Forgot password?
              </a>
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? (
                <>
                  <Loader2 className={styles.spinner} size={16} />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in to admin</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className={styles.divider}>
              <span className={styles.dividerSpan}>Authorized staff only</span>
            </div>

            <div className={styles.storefrontLinkGroup}>
              <span>Need storefront access?</span>
              <Link href="/login" className={styles.storefrontLink}>
                Customer sign in
              </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
