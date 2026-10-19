import { Star } from 'lucide-react';
import styles from './RatingStars.module.css';

interface RatingStarsProps {
  rating: number;
  size?: number;
}

export default function RatingStars({ rating, size = 16 }: RatingStarsProps) {
  const normalizedRating = Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 0;

  return (
    <span
      className={styles.stars}
      role="img"
      aria-label={`${normalizedRating.toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const fillPercent = Math.min(100, Math.max(0, (normalizedRating - index) * 100));

        return (
          <span className={styles.star} key={index}>
            <Star size={size} className={styles.outline} aria-hidden="true" />
            <span className={styles.fill} style={{ width: `${fillPercent}%` }}>
              <Star size={size} className={styles.filled} aria-hidden="true" />
            </span>
          </span>
        );
      })}
    </span>
  );
}
