'use client';

import RatingStars from '@/components/products/RatingStars';
import styles from './ProductRatingField.module.css';

const RATING_OPTIONS = Array.from({ length: 11 }, (_, index) => index / 2);

interface ProductRatingFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  showError?: boolean;
  preserveCurrentRating?: boolean;
}

export default function ProductRatingField({
  value,
  onChange,
  error,
  showError = false,
  preserveCurrentRating = false,
}: ProductRatingFieldProps) {
  const numericRating = value === '' ? 0 : Number(value);
  const hasLegacyRating = preserveCurrentRating
    && value !== ''
    && Number.isFinite(numericRating)
    && !Number.isInteger(numericRating * 2);

  return (
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel} htmlFor="rating">
        Product Rating <span className={styles.requiredMarker}>*</span>
      </label>
      <div className={styles.ratingControl}>
        <select
          id="rating"
          name="rating"
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${styles.selectField} ${showError && error ? styles.fieldError : ''}`}
          aria-describedby="rating-hint"
          aria-invalid={showError && Boolean(error)}
        >
          {!preserveCurrentRating && (
            <option value="" disabled>Select rating</option>
          )}
          {hasLegacyRating && (
            <option value={value}>{numericRating.toFixed(1)} / 5 (current rating)</option>
          )}
          {RATING_OPTIONS.map((rating) => (
            <option key={rating} value={rating}>
              {rating.toFixed(1)} / 5
            </option>
          ))}
        </select>
        <RatingStars rating={numericRating} size={18} />
      </div>
      {showError && error
        ? <span className={styles.errorText}>{error}</span>
        : <span className={styles.hintText} id="rating-hint">Choose a rating in half-star increments.</span>}
    </div>
  );
}
