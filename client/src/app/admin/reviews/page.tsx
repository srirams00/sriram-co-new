'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { AdminProductReview } from '@/types/review';
import styles from './reviews.module.css';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminProductReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('src_auth_token');

    if (!token) {
      setError('Your admin session has expired. Sign in again to manage reviews.');
      setIsLoading(false);
      return;
    }

    api.getAdminProductReviews(token)
      .then((data) => {
        if (!cancelled) setReviews(data);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load customer reviews.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (review: AdminProductReview) => {
    if (!window.confirm(`Delete this review for "${review.product.name}"? This cannot be undone.`)) return;

    const token = localStorage.getItem('src_auth_token');
    if (!token) {
      setError('Your admin session has expired. Sign in again to manage reviews.');
      return;
    }

    setDeletingId(review.id);
    setError('');
    try {
      await api.deleteProductReview(review.id, token);
      setReviews((current) => current.filter((item) => item.id !== review.id));
    } catch (deleteError: unknown) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete this review.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2>Customer reviews</h2>
          <p>Review customer feedback and remove reviews when necessary.</p>
        </div>
        <span className={styles.count}>{reviews.length} reviews</span>
      </header>

      {error && <p className={styles.error} role="alert">{error}</p>}
      {isLoading ? (
        <p className={styles.message} role="status">Loading customer reviews…</p>
      ) : reviews.length === 0 && !error ? (
        <p className={styles.message}>There are no customer reviews to manage yet.</p>
      ) : (
        <div className={styles.reviewList}>
          {reviews.map((review) => (
            <article className={styles.reviewCard} key={review.id}>
              <div className={styles.reviewTop}>
                <div>
                  <Link className={styles.productLink} href={`/product/${encodeURIComponent(review.product.slug)}`}>
                    {review.product.name}
                  </Link>
                  <p className={styles.customer}>{review.customerName}</p>
                </div>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => handleDelete(review)}
                  disabled={deletingId === review.id}
                  aria-label={`Delete review for ${review.product.name} by ${review.customerName}`}
                >
                  <Trash2 size={16} />
                  <span>{deletingId === review.id ? 'Deleting…' : 'Delete'}</span>
                </button>
              </div>
              <div className={styles.rating}>
                <span className={styles.stars} aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star key={index} size={15} fill={index < review.rating ? 'currentColor' : 'none'} />
                  ))}
                </span>
                <time dateTime={review.createdAt}>
                  {new Date(review.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </time>
              </div>
              <p className={styles.comment}>{review.comment}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
