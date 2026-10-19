'use client';

import React, { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { api } from '@/lib/api';
import type { ProductReview } from '@/types/review';
import RatingStars from './RatingStars';
import styles from './ProductReviews.module.css';

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('src_auth_token');
    setIsAuthenticated(Boolean(token));

    api.getProductReviews(productId, token || undefined)
      .then((summary) => {
        if (cancelled) return;
        setReviews(summary.reviews);
        setAverageRating(summary.averageRating);
        setReviewCount(summary.reviewCount);
        setCanReview(summary.canReview);
        setHasReviewed(summary.hasReviewed);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load product reviews.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('src_auth_token');
    if (!token) {
      setIsAuthenticated(false);
      setError('Sign in to submit a review.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.createProductReview(productId, { rating, comment }, token);
      setReviews((currentReviews) => [result.review, ...currentReviews]);
      setAverageRating(result.averageRating);
      setReviewCount(result.reviewCount);
      setCanReview(false);
      setHasReviewed(true);
      setComment('');
      setRating(0);
      setSuccess('Thanks for sharing your review.');
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Could not submit your review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.section} aria-labelledby="product-reviews-title">
      <div className={styles.header}>
        <div>
          <h2 id="product-reviews-title" className="heading-section">Customer reviews</h2>
          <p className={styles.subtitle}>Share your experience with this product.</p>
        </div>
        {reviewCount > 0 && (
          <div className={styles.summary} aria-label={`${averageRating.toFixed(1)} out of 5 from ${reviewCount} reviews`}>
            <RatingStars rating={averageRating} />
            <strong>{averageRating.toFixed(1)}</strong>
            <span>{reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className={styles.message} role="status">Loading reviews…</p>
      ) : (
        <>
          {canReview && (
            <form className={styles.form} onSubmit={handleSubmit}>
              <h3>Write a review</h3>
              <span className={styles.ratingLabel}>Your rating</span>
              <div className={styles.ratingInput} role="group" aria-label="Choose a rating">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={styles.starButton}
                    onClick={() => setRating(value)}
                    aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
                    aria-pressed={rating === value}
                  >
                    <Star size={24} fill={value <= rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
              <label className={styles.ratingLabel} htmlFor={`review-comment-${productId}`}>Your review</label>
              <textarea
                id={`review-comment-${productId}`}
                className={styles.textarea}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                minLength={10}
                maxLength={1000}
                rows={5}
                required
                placeholder="What did you think of this product?"
              />
              <div className={styles.formFooter}>
                <span>{comment.length}/1000 characters</span>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
                >
                  {isSubmitting ? 'Submitting…' : 'Submit review'}
                </button>
              </div>
            </form>
          )}

          {!canReview && !hasReviewed && (
            <div className={styles.reviewNotice}>
              {isAuthenticated ? (
                <p>Sign in to share your experience with this product.</p>
              ) : (
                <p>
                  <Link href="/login">Sign in</Link> to check whether you can review this product.
                </p>
              )}
            </div>
          )}

          {hasReviewed && (
            <p className={styles.reviewNotice}>You have already reviewed this product. Thank you!</p>
          )}

          {error && <p className={styles.error} role="alert">{error}</p>}
          {success && <p className={styles.success} role="status">{success}</p>}

          {reviews.length > 0 ? (
            <div className={styles.reviewList}>
              {reviews.map((review, index) => (
                <article className={styles.reviewCard} key={`${review.createdAt}-${index}`}>
                  <div className={styles.reviewHeading}>
                    <strong>{review.customerName}</strong>
                    <span className={styles.verified}>Customer review</span>
                  </div>
                  <div className={styles.reviewMeta}>
                    <RatingStars rating={review.rating} size={14} />
                    <time dateTime={review.createdAt}>
                      {new Date(review.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </time>
                  </div>
                  <p className={styles.reviewComment}>{review.comment}</p>
                </article>
              ))}
            </div>
          ) : !error ? (
            <p className={styles.emptyState}>No customer reviews yet. Be the first to share one.</p>
          ) : null}
        </>
      )}
    </section>
  );
}
