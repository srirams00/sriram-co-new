'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { loginWithGooglePopup } from '@/lib/firebase';
import { extractErrorMessage } from '@/lib/api';
import styles from './auth.module.css';

interface LoginErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [errors, setErrors] = useState<LoginErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setServerError(null);

      const firebaseUser = await loginWithGooglePopup();
      if (!firebaseUser.email) {
        throw new Error('Google sign-in did not return an email address');
      }

      const idToken = await firebaseUser.getIdToken();
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          photoUrl: firebaseUser.photoURL || '',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Google authentication failed');
      }

      if (data.token) {
        localStorage.setItem('src_auth_token', data.token);
        localStorage.setItem('src_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth-change'));
      }

      const redirectParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null;
      if (redirectParam) {
        router.push(redirectParam);
      } else {
        router.push('/account');
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setServerError(err.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const validateField = (field: 'email' | 'password', value: string): string | undefined => {
    if (field === 'email') {
      if (!value.trim()) return 'Email address is required';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.trim())) return 'Please enter a valid email address';
      return undefined;
    }
    if (field === 'password') {
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Password must be at least 6 characters';
      return undefined;
    }
    return undefined;
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, field === 'email' ? email : password);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (field: 'email' | 'password', value: string) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);

    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: LoginErrors = {
      email: validateField('email', email),
      password: validateField('password', password),
    };

    setTouched({ email: true, password: true });
    setErrors(newErrors);

    if (newErrors.email || newErrors.password) {
      return;
    }

    setLoading(true);
    setServerError(null);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!res.ok) {
        const errorMsg = await extractErrorMessage(res, 'Invalid email or password');
        throw new Error(errorMsg);
      }

      const data = await res.json();

      if (data.token) {
        localStorage.setItem('src_auth_token', data.token);
        localStorage.setItem('src_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth-change'));
      }

      const redirectParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null;
      if (redirectParam) {
        router.push(redirectParam);
      } else {
        router.push('/account');
      }
    } catch (err: any) {
      setServerError(err.message || 'Unable to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authWrapper}>
      <div className={styles.authCard}>
        {/* Left Editorial Panel */}
        <div className={styles.editorialSide}>
          <div className={styles.brandHeader}>
            <div className={styles.brandBadge}>S</div>
            <div>
              <div className={styles.brandName}>Sri Ram &amp; Co</div>
              <div className={styles.brandTagline}>Home &amp; More</div>
            </div>
          </div>

          <div className={styles.editorialContent}>
            <span className={styles.eyebrowGreen}>A Better Home Starts Here</span>
            <h2 className={styles.editorialHeadline}>
              Good things for everyday living.
            </h2>
            <p className={styles.editorialDesc}>
              Keep your favourites close, track every order, and make your next home upgrade feel effortless.
            </p>
          </div>

          <div className={styles.editorialFooter}>
            Trusted home essentials since 2004
          </div>
        </div>

        {/* Right Form Panel */}
        <div className={styles.formSide}>
          <div className={styles.formHeader}>
            <span className={styles.eyebrowDark}>Welcome Back</span>
            <h1 className={styles.formTitle}>Sign in to continue.</h1>
            <p className={styles.formSubtitle}>
              Your favourites, orders, and cart are waiting for you.
            </p>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            className={styles.googleBtn}
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <span>Connecting to Google...</span>
            ) : (
              <>
                <svg className={styles.googleIcon} viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </>
        )}
      </button>

          {/* Divider */}
          <div className={styles.divider}>
            <span className={styles.dividerText}>or</span>
          </div>

          {serverError && (
            <div className={styles.errorBanner} role="alert" aria-live="assertive">
              {serverError}
            </div>
          )}

          {/* Form with custom inline validation */}
          <form onSubmit={handleLogin} noValidate className={styles.authForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="loginEmail">Email address</label>
              <input
                id="loginEmail"
                type="email"
                autoComplete="email"
                aria-required="true"
                aria-invalid={Boolean(touched.email && errors.email)}
                aria-describedby={touched.email && errors.email ? "loginEmail-error" : undefined}
                placeholder="you@example.com"
                value={email}
                className={touched.email && errors.email ? styles.inputError : ''}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
              />
              {touched.email && errors.email && (
                <div id="loginEmail-error" className={styles.fieldError} role="alert">
                  <AlertCircle size={14} />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="loginPassword">Password</label>
                <Link href="/forgot-password" className={styles.forgotLink}>
                  Forgot Password?
                </Link>
              </div>
              <div className={styles.passwordWrapper}>
                <input
                  id="loginPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-required="true"
                  aria-invalid={Boolean(touched.password && errors.password)}
                  aria-describedby={touched.password && errors.password ? "loginPassword-error" : undefined}
                  placeholder="Enter your password"
                  value={password}
                  className={touched.password && errors.password ? styles.inputError : ''}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                />
                <button
                  type="button"
                  className={styles.eyeToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {touched.password && errors.password && (
                <div id="loginPassword-error" className={styles.fieldError} role="alert">
                  <AlertCircle size={14} />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer switch prompt */}
          <div className={styles.switchPrompt}>
            New to Sri Ram &amp; Co?
            <Link href="/register" className={styles.switchLink}>
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
