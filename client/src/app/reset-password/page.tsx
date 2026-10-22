'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { api } from '@/lib/api';
import styles from '../login/auth.module.css';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState(emailParam);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [touched, setTouched] = useState<{ password?: boolean; confirmPassword?: boolean }>({});
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError('Password reset link is missing or incomplete. Please request a new link.');
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const res = await api.verifyResetToken(token);
        if (!isMounted) return;
        if (res.valid) {
          setTokenValid(true);
          if (res.email) setUserEmail(res.email);
        } else {
          setTokenValid(false);
          setTokenError(res.message || 'Password reset link is invalid or has expired.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setTokenValid(false);
        setTokenError(err.message || 'Unable to verify reset link. Please try again.');
      } finally {
        if (isMounted) setVerifying(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const validateField = (field: 'password' | 'confirmPassword', val: string): string | undefined => {
    if (field === 'password') {
      if (!val) return 'Password is required';
      if (val.length < 6) return 'Password must be at least 6 characters';
      return undefined;
    }
    if (field === 'confirmPassword') {
      if (!val) return 'Please confirm your password';
      if (val !== password) return 'Passwords do not match';
      return undefined;
    }
    return undefined;
  };

  const handleBlur = (field: 'password' | 'confirmPassword') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, field === 'password' ? password : confirmPassword);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleChange = (field: 'password' | 'confirmPassword', val: string) => {
    if (field === 'password') {
      setPassword(val);
      if (touched.confirmPassword && confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          password: validateField('password', val),
          confirmPassword: val !== confirmPassword ? 'Passwords do not match' : undefined,
        }));
        return;
      }
    } else {
      setConfirmPassword(val);
    }

    if (touched[field]) {
      const err = validateField(field, val);
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      password: validateField('password', password),
      confirmPassword: validateField('confirmPassword', confirmPassword),
    };

    setTouched({ password: true, confirmPassword: true });
    setErrors(newErrors);

    if (newErrors.password || newErrors.confirmPassword) {
      return;
    }

    setSubmitting(true);
    setServerError(null);

    try {
      await api.resetPassword(token, password);
      setResetSuccess(true);
    } catch (err: any) {
      setServerError(err.message || 'Failed to update your password. Please try again.');
    } finally {
      setSubmitting(false);
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
            <span className={styles.eyebrowGreen}>Account Protection</span>
            <h2 className={styles.editorialHeadline}>
              Create a fresh, secure password.
            </h2>
            <p className={styles.editorialDesc}>
              Choose a strong password to protect your personal details, order history, and saved items.
            </p>
          </div>

          <div className={styles.editorialFooter}>
            Trusted home essentials since 2004
          </div>
        </div>

        {/* Right Form Panel */}
        <div className={styles.formSide}>
          <div className={styles.formHeader}>
            <span className={styles.eyebrowDark}>Security Credentials</span>
            <h1 className={styles.formTitle}>Reset your password</h1>
            <p className={styles.formSubtitle}>
              {userEmail ? `Setting a new password for ${userEmail}` : 'Enter your new password below.'}
            </p>
          </div>

          {serverError && (
            <div className={styles.errorBanner} role="alert" aria-live="assertive">
              {serverError}
            </div>
          )}

          {verifying ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#68786D' }}>
              <p>Verifying your security token...</p>
            </div>
          ) : !tokenValid ? (
            <div className={styles.authForm}>
              <div className={styles.errorBanner} role="alert" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>Invalid or Expired Link</strong>
                    {tokenError || 'This password reset link is invalid or has expired.'}
                  </div>
                </div>
              </div>

              <p className={styles.authNoticeText}>
                For your security, reset links expire after 1 hour. You can request a fresh reset link anytime.
              </p>

              <Link href="/forgot-password" className={styles.submitBtn} style={{ textAlign: 'center', textDecoration: 'none' }}>
                Request New Reset Link
              </Link>

              <div className={styles.switchPrompt}>
                Remember your password?{' '}
                <Link href="/login" className={styles.switchLink}>
                  Sign In
                </Link>
              </div>
            </div>
          ) : resetSuccess ? (
            <div className={styles.authForm}>
              <div className={styles.successBanner} role="status">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>Password Reset Successful</strong>
                    Your password has been securely updated. You can now sign in using your new credentials.
                  </div>
                </div>
              </div>

              <Link href="/login" className={styles.submitBtn} style={{ textAlign: 'center', textDecoration: 'none' }}>
                Sign In with New Password
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className={styles.authForm}>
              {/* New Password */}
              <div className={styles.inputGroup}>
                <label htmlFor="newPassword">New Password</label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    aria-required="true"
                    aria-invalid={Boolean(touched.password && errors.password)}
                    aria-describedby={touched.password && errors.password ? 'newPassword-error' : undefined}
                    placeholder="At least 6 characters"
                    value={password}
                    className={touched.password && errors.password ? styles.inputError : ''}
                    onChange={(e) => handleChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    disabled={submitting}
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
                  <div id="newPassword-error" className={styles.fieldError} role="alert">
                    <AlertCircle size={14} />
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div className={styles.inputGroup}>
                <label htmlFor="confirmNewPassword">Confirm New Password</label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="confirmNewPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    aria-required="true"
                    aria-invalid={Boolean(touched.confirmPassword && errors.confirmPassword)}
                    aria-describedby={touched.confirmPassword && errors.confirmPassword ? 'confirmNewPassword-error' : undefined}
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    className={touched.confirmPassword && errors.confirmPassword ? styles.inputError : ''}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    onBlur={() => handleBlur('confirmPassword')}
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className={styles.eyeToggle}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {touched.confirmPassword && errors.confirmPassword && (
                  <div id="confirmNewPassword-error" className={styles.fieldError} role="alert">
                    <AlertCircle size={14} />
                    <span>{errors.confirmPassword}</span>
                  </div>
                )}
              </div>

              <button type="submit" disabled={submitting} className={styles.submitBtn}>
                {submitting ? 'Resetting password...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.authWrapper}>
          <div className={styles.authCard} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
            <p style={{ color: '#68786D', fontFamily: 'var(--font-body)' }}>Loading security verification...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
