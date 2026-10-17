'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { loginWithGooglePopup } from '@/lib/firebase';
import { extractErrorMessage } from '@/lib/api';
import styles from '../login/auth.module.css';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [touched, setTouched] = useState<{ [K in keyof FormErrors]?: boolean }>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleGoogleSignUp = async () => {
    if (!termsAccepted) {
      setServerError('Please accept the Terms and Conditions before creating an account.');
      return;
    }

    try {
      setGoogleLoading(true);
      setServerError(null);

      const firebaseUser = await loginWithGooglePopup();
      if (!firebaseUser.email) {
        throw new Error('Google sign-up did not return an email address');
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
        throw new Error(data.message || 'Google registration failed');
      }

      if (data.token) {
        localStorage.setItem('src_auth_token', data.token);
        localStorage.setItem('src_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth-change'));
      }

      router.push('/account');
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setServerError(err.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const validateField = (field: keyof FormErrors, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return undefined;

      case 'email':
        if (!value.trim()) return 'Email address is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) return 'Please enter a valid email address';
        return undefined;

      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return undefined;

      default:
        return undefined;
    }
  };

  const handleBlur = (field: keyof FormErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (field: keyof FormErrors, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      setServerError('Please accept the Terms and Conditions before creating an account.');
      return;
    }
    setServerError(null);

    // Validate all fields
    const newErrors: FormErrors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
    };

    setTouched({ name: true, email: true, password: true });
    setErrors(newErrors);

    if (newErrors.name || newErrors.email || newErrors.password) {
      return;
    }

    setLoading(true);
    setServerError(null);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      if (!res.ok) {
        const errorMsg = await extractErrorMessage(res, 'Unable to create account');
        throw new Error(errorMsg);
      }

      const data = await res.json();

      if (data.token) {
        localStorage.setItem('src_auth_token', data.token);
        localStorage.setItem('src_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth-change'));
      }

      router.push('/account');
    } catch (err: any) {
      setServerError(err.message || 'Unable to create account. Please check your information.');
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
            </div>
          </div>

          <div className={styles.editorialContent}>
            <span className={styles.eyebrowGreen}>Make Home Yours</span>
            <h2 className={styles.editorialHeadline}>
              Thoughtful finds. Happier spaces.
            </h2>
            <p className={styles.editorialDesc}>
              Create your account to save the pieces you love and enjoy a smoother way to shop.
            </p>
          </div>

          <div className={styles.editorialFooter}>
            Simple shopping. Personal service.
          </div>
        </div>

        {/* Right Form Panel */}
        <div className={styles.formSide}>
          <div className={styles.formHeader}>
            <span className={styles.eyebrowDark}>Join Sri Ram &amp; Co</span>
            <h1 className={styles.formTitle}>Create your account.</h1>
            <p className={styles.formSubtitle}>
              Start building a home you love, one useful thing at a time.
            </p>
            <label className={styles.termsAcceptance}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => {
                  setTermsAccepted(event.target.checked);
                  if (event.target.checked) setServerError(null);
                }}
                required
                aria-required="true"
              />
              <span>
                I agree to the{' '}
                <Link href="/terms" target="_blank" rel="noopener noreferrer">
                  Terms and Conditions
                </Link>
                .
              </span>
            </label>
          </div>

          {/* Google Sign Up */}
          <button
            type="button"
            className={styles.googleBtn}
            onClick={handleGoogleSignUp}
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
                Sign up with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className={styles.divider}>
            <span className={styles.dividerText}>or</span>
          </div>

          {serverError && (
            <div className={styles.errorBanner} role="alert" aria-live="assertive" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>
                {serverError}{' '}
                {serverError.toLowerCase().includes('already exists') && (
                  <Link href="/login" style={{ textDecoration: 'underline', fontWeight: 600, color: 'inherit' }}>
                    Sign in here &rarr;
                  </Link>
                )}
              </span>
            </div>
          )}

          {/* Registration Form with custom validation */}
          <form onSubmit={handleRegister} noValidate className={styles.authForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="regName">Full name</label>
              <input
                id="regName"
                type="text"
                autoComplete="name"
                aria-required="true"
                aria-invalid={Boolean(touched.name && errors.name)}
                aria-describedby={touched.name && errors.name ? "regName-error" : undefined}
                placeholder="Your name"
                value={formData.name}
                className={touched.name && errors.name ? styles.inputError : ''}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
              />
              {touched.name && errors.name && (
                <div id="regName-error" className={styles.fieldError} role="alert">
                  <AlertCircle size={14} />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="regEmail">Email address</label>
              <input
                id="regEmail"
                type="email"
                autoComplete="email"
                aria-required="true"
                aria-invalid={Boolean(touched.email && errors.email)}
                aria-describedby={touched.email && errors.email ? "regEmail-error" : undefined}
                placeholder="you@example.com"
                value={formData.email}
                className={touched.email && errors.email ? styles.inputError : ''}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
              />
              {touched.email && errors.email && (
                <div id="regEmail-error" className={styles.fieldError} role="alert">
                  <AlertCircle size={14} />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="regPassword">Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  id="regPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={Boolean(touched.password && errors.password)}
                  aria-describedby={touched.password && errors.password ? "regPassword-error" : undefined}
                  placeholder="Create a password (min. 6 characters)"
                  value={formData.password}
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
                <div id="regPassword-error" className={styles.fieldError} role="alert">
                  <AlertCircle size={14} />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          {/* Footer switch prompt */}
          <div className={styles.switchPrompt}>
            Already have an account?
            <Link href="/login" className={styles.switchLink}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
