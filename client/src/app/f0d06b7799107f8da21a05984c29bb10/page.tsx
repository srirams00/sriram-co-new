'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { extractErrorMessage } from '@/lib/api';
import styles from '@/app/login/auth.module.css';

const ADMIN_ROUTE = '/admin';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

interface AdminLoginResponse {
  token: string;
  user: {
    role: string;
  };
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function verifyExistingSession() {
      const token = localStorage.getItem('src_auth_token');
      if (!token) {
        if (isCurrent) setVerifyingSession(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });

        if (!isCurrent) return;

        if (!response.ok) {
          localStorage.removeItem('src_auth_token');
          localStorage.removeItem('src_user');
          setVerifyingSession(false);
          return;
        }

        const user = await response.json();
        if (user.role === 'admin') {
          router.replace(ADMIN_ROUTE);
          return;
        }
      } catch {
        if (isCurrent) {
          setError('Unable to verify your existing session. You can still sign in below.');
        }
      }

      if (isCurrent) setVerifyingSession(false);
    }

    void verifyExistingSession();
    return () => {
      isCurrent = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, 'Administrator sign-in failed'));
      }

      const data = (await response.json()) as AdminLoginResponse;
      if (!data.token || data.user?.role !== 'admin') {
        throw new Error('Administrator access could not be verified.');
      }

      localStorage.setItem('src_auth_token', data.token);
      localStorage.setItem('src_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth-change'));
      router.replace(ADMIN_ROUTE);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to sign in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (verifyingSession) {
    return (
      <div className={styles.authWrapper}>
        <div role="status" aria-live="polite">
          <Loader2 size={22} />
          <span>Validating administrator session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authWrapper}>
      <div className={styles.authCard}>
        <section className={styles.editorialSide}>
          <div className={styles.brandHeader}>
            <div className={styles.brandBadge}>S</div>
            <div>
              <div className={styles.brandName}>Sri Ram &amp; Co</div>
              <div className={styles.brandTagline}>Administrator workspace</div>
            </div>
          </div>
          <div className={styles.editorialContent}>
            <span className={styles.eyebrowGreen}>Secure administrator access</span>
            <h1 className={styles.editorialHeadline}>Run the store with clarity.</h1>
            <p className={styles.editorialDesc}>
              Sign in to manage the product catalog, orders, and customer reviews.
            </p>
          </div>
          <div className={styles.editorialFooter}>
            Administrator credentials are required to continue.
          </div>
        </section>

        <section className={styles.formSide}>
          <div className={styles.formHeader}>
            <span className={styles.eyebrowDark}>Admin access</span>
            <h2 className={styles.formTitle}>Welcome back.</h2>
            <p className={styles.formSubtitle}>Sign in with your administrator account.</p>
          </div>

          {error && (
            <div className={styles.errorBanner} role="alert">
              <AlertCircle size={16} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form className={styles.authForm} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="admin-email">Work email</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                placeholder="admin.ops@sriramandco.in"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="admin-password">Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeToggle}
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in to admin'}
            </button>
          </form>

          <p className={styles.switchPrompt}>
            <ShieldCheck size={15} aria-hidden="true" />
            <span>Access is restricted to administrator accounts.</span>
          </p>
          <p className={styles.switchPrompt}>
            <Link href="/">Return to storefront</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
