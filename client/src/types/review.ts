export interface ProductReview {
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ProductReviewSummary {
  reviews: ProductReview[];
  averageRating: number;
  reviewCount: number;
  canReview: boolean;
  hasReviewed: boolean;
}
