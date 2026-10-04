'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to account after login
    router.push('/account');
  };

  return (
    <div className={styles.authPage}>
      <div className="container">
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <div className={styles.logoIcon}>
              <div className={styles.logoDot} />
            </div>
            <h1>Welcome Back</h1>
            <p>Sign in to your Sriram &amp; Co customer account</p>
          </div>

          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="phoneOrEmail">Mobile Number or Email</label>
              <input
                id="phoneOrEmail"
                type="text"
                required
                placeholder="+91 94432 XXXXX or email"
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`}>
              Sign In
            </button>
          </form>

          <div className={styles.authFooter}>
            <p>
              New to Sriram &amp; Co?{' '}
              <Link href="/register" className={styles.link}>
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
