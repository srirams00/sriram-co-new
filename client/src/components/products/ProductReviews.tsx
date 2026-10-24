'use client';

import React, { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { Star, Check, CheckCircle2, MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';
import type { ProductReview } from '@/types/review';
import RatingStars from './RatingStars';
import styles from './ProductReviews.module.css';

interface ProductReviewsProps {
  productId: string;
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

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
  const [hoverRating, setHoverRating] = useState(0);
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
        setReviews(summary.reviews || []);
        setAverageRating(summary.averageRating || 0);
        setReviewCount(summary.reviewCount ?? (summary.reviews?.length || 0));
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

    if (rating === 0) {
      setError('Please select a star rating from 1 to 5.');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Please provide a review of at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createProductReview(productId, { rating, comment: comment.trim() }, token);
      setCanReview(false);
      setHasReviewed(true);
      if (res.review) {
        setReviews((prev) => [res.review, ...prev.filter((r) => r.id !== res.review.id)]);
      }
      if (typeof res.averageRating === 'number') {
        setAverageRating(res.averageRating);
      }
      if (typeof res.reviewCount === 'number') {
        setReviewCount(res.reviewCount);
      }
      setComment('');
      setRating(0);
      setHoverRating(0);
      setSuccess('Thanks for sharing your review! Your review is now live.');
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Could not submit your review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeDisplayRating = hoverRating || rating;

  return (
    <section id="reviews-section" className={styles.section} aria-labelledby="product-reviews-title">
      {/* Header with Title and Summary Score */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 id="product-reviews-title" className="heading-section">Customer Reviews</h2>
          <p className={styles.subtitle}>Verified feedback and experiences from Sri Ram &amp; Co customers.</p>
        </div>

        {!isLoading && (
          <div className={styles.summaryCard}>
            <span className={styles.summaryScore}>
              {reviewCount > 0 ? averageRating.toFixed(1) : '—'}
            </span>
            <div className={styles.summaryStarsWrap}>
              <RatingStars rating={averageRating} size={18} />
              <span className={styles.summaryCount}>
                {reviewCount > 0
                  ? `Based on ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`
                  : 'No reviews yet'}
              </span>
            </div>
          </div>
        )}
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}
      {success && <p className={styles.success} role="status">{success}</p>}

      {isLoading ? (
        <p className={styles.message} role="status">Checking review availability…</p>
      ) : (
        <>
          {/* Write Review Form */}
          {canReview && (
            <form className={styles.form} onSubmit={handleSubmit}>
              <h3 className={styles.formTitle}>Write a review</h3>
              <div className={styles.ratingRow}>
                <div className={styles.ratingHeader}>
                  <span className={styles.ratingLabel}>Your rating</span>
                  {activeDisplayRating > 0 && (
                    <span className={styles.ratingHint}>
                      {RATING_DESCRIPTIONS[activeDisplayRating] || `${activeDisplayRating} stars`}
                    </span>
                  )}
                </div>
                <div className={styles.ratingInput} role="group" aria-label="Choose a rating from 1 to 5 stars">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={styles.starButton}
                      onClick={() => setRating(value)}
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
                      aria-pressed={rating === value}
                    >
                      <Star
                        size={26}
                        fill={value <= activeDisplayRating ? '#d49a21' : 'none'}
                        stroke="#d49a21"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <label className={styles.ratingLabel} htmlFor={`review-comment-${productId}`}>
                Your review
              </label>
              <textarea
                id={`review-comment-${productId}`}
                className={styles.textarea}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                minLength={10}
                maxLength={1000}
                rows={4}
                required
                placeholder="Share details of your experience with this product (minimum 10 characters)…"
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

          {/* Already Reviewed Banner */}
          {hasReviewed && (
            <div className={styles.reviewedNotice}>
              <CheckCircle2 size={20} className={styles.reviewedIcon} />
              <span>You have already reviewed this product. Thank you!</span>
            </div>
          )}

          {/* Sign in Prompt */}
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

          {/* Customer Reviews List */}
          <div className={styles.reviewsListSection}>
            <h3 className={styles.reviewsListTitle}>
              Customer Feedback {reviews.length > 0 ? `(${reviews.length})` : ''}
            </h3>

            {reviews.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <MessageSquare size={28} />
                </div>
                <h4>No reviews yet</h4>
                <p>Be the first customer to share your thoughts on this product!</p>
              </div>
            ) : (
              <div className={styles.reviewList}>
                {reviews.map((rev, index) => {
                  const reviewKey = rev.id || rev._id || `${rev.customerName}-${rev.createdAt}-${index}`;
                  const initials =
                    rev.customerName
                      ?.trim()
                      .split(/\s+/)
                      .map((word) => word[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'U';

                  const formattedDate = rev.createdAt
                    ? new Date(rev.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '';

                  return (
                    <article className={styles.reviewCard} key={reviewKey}>
                      <div className={styles.reviewCardHeader}>
                        <div className={styles.reviewerInfo}>
                          <div className={styles.avatar} aria-hidden="true">
                            {initials}
                          </div>
                          <div>
                            <div className={styles.nameRow}>
                              <span className={styles.reviewerName}>{rev.customerName}</span>
                              <span className={styles.verifiedBadge}>
                                <Check size={12} strokeWidth={2.8} /> Verified Buyer
                              </span>
                            </div>
                            {formattedDate && (
                              <time className={styles.reviewDate} dateTime={rev.createdAt}>
                                {formattedDate}
                              </time>
                            )}
                          </div>
                        </div>

                        <div className={styles.ratingStarsWrap}>
                          <RatingStars rating={rev.rating} size={15} />
                          <span className={styles.ratingNumeric}>{rev.rating}.0</span>
                        </div>
                      </div>

                      <p className={styles.reviewComment}>{rev.comment}</p>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
