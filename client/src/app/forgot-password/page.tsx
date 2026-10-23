'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import styles from '../login/auth.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmail = (val: string): string | null => {
    if (!val.trim()) return 'Email address is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) return 'Please enter a valid email address';
    return null;
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateEmail(email));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (serverError) {
      setServerError(null);
    }
    if (touched) {
      setError(validateEmail(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    const validationErr = validateEmail(email);
    setError(validationErr);
    if (validationErr) return;

    setLoading(true);
    setServerError(null);

    try {
      const res = await api.forgotPassword(email.trim());
      if (res && res.success) {
        setSuccessMessage(
          res.message ||
            `A password reset link has been dispatched to ${email.trim()}. Please check your inbox.`
        );
        setSubmitted(true);
      } else {
        setServerError(res?.message || 'Unable to process your request. Please check the email entered.');
      }
    } catch (err: any) {
      setServerError(err.message || 'Unable to process your request. Please try again.');
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
            <span className={styles.eyebrowGreen}>Account Recovery</span>
            <h2 className={styles.editorialHeadline}>
              Restore access to your home essentials.
            </h2>
            <p className={styles.editorialDesc}>
              Quick, secure self-service recovery. Enter your email and we&apos;ll dispatch a one-click reset link straight to your inbox.
            </p>
          </div>

          <div className={styles.editorialFooter}>
            Trusted home essentials since 2004
          </div>
        </div>

        {/* Right Form Panel */}
        <div className={styles.formSide}>
          <div className={styles.formHeader}>
            <span className={styles.eyebrowDark}>Self-Service Security</span>
            <h1 className={styles.formTitle}>Forgot password?</h1>
            <p className={styles.formSubtitle}>
              {submitted
                ? 'Check your inbox for further instructions.'
                : 'Enter your registered email address to receive a secure password reset link.'}
            </p>
          </div>

          {serverError && (
            <div className={styles.errorBanner} role="alert" aria-live="assertive">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  {serverError.toLowerCase().includes('no account') ? (
                    <>
                      <strong style={{ display: 'block', marginBottom: '3px' }}>Account Not Found</strong>
                      <div>{serverError}</div>
                      <div style={{ marginTop: '8px' }}>
                        <Link
                          href="/register"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#991B1B',
                            fontWeight: 700,
                            textDecoration: 'underline',
                            fontSize: '0.85rem',
                          }}
                        >
                          Don&apos;t have an account? Create one now &rarr;
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div>{serverError}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {submitted ? (
            <div className={styles.authForm}>
              <div className={styles.successBanner} role="status">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>Reset Link Sent</strong>
                    {successMessage}
                  </div>
                </div>
              </div>

              <p className={styles.authNoticeText}>
                The password reset link is valid for <strong>1 hour</strong>. Please check your spam or promotions folder if the email doesn&apos;t appear in your main inbox shortly.
              </p>

              <Link href="/login" className={styles.submitBtn} style={{ textAlign: 'center', textDecoration: 'none' }}>
                Return to Sign In
              </Link>

              <div className={styles.switchPrompt}>
                Didn&apos;t receive the email?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setSuccessMessage('');
                    setServerError(null);
                  }}
                  className={styles.switchLink}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Try another address
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className={styles.authForm}>
              <div className={styles.inputGroup}>
                <label htmlFor="recoveryEmail">Email address</label>
                <input
                  id="recoveryEmail"
                  type="email"
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={Boolean(touched && error)}
                  aria-describedby={touched && error ? 'recoveryEmail-error' : undefined}
                  placeholder="you@example.com"
                  value={email}
                  className={touched && error ? styles.inputError : ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                />
                {touched && error && (
                  <div id="recoveryEmail-error" className={styles.fieldError} role="alert">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>

              <div className={styles.switchPrompt}>
                Remember your password?{' '}
                <Link href="/login" className={styles.switchLink}>
                  Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
