import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      backgroundColor: 'var(--color-bg-page, #F7F8F5)',
    }}>
      <h1 style={{
        fontFamily: 'var(--font-heading, sans-serif)',
        fontSize: '3rem',
        fontWeight: 700,
        color: 'var(--color-forest-green, #174A2B)',
        marginBottom: '12px',
      }}>
        404
      </h1>
      <h2 style={{
        fontFamily: 'var(--font-heading, sans-serif)',
        fontSize: '1.5rem',
        fontWeight: 600,
        color: 'var(--color-text-dark, #121814)',
        marginBottom: '12px',
      }}>
        Page Not Found
      </h2>
      <p style={{
        fontSize: '1rem',
        color: 'var(--color-text-secondary, #68786D)',
        maxWidth: '480px',
        marginBottom: '28px',
        lineHeight: 1.6,
      }}>
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-forest-green, #174A2B)',
          color: '#ffffff',
          fontWeight: 600,
          padding: '12px 28px',
          borderRadius: '8px',
          textDecoration: 'none',
          transition: 'background-color 0.2s ease',
        }}
      >
        Return to Store Home
      </Link>
    </div>
  );
}
