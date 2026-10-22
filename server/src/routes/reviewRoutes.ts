import { Router, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest, authenticate, authenticateIfPresent, requireAdmin } from '../middleware/authMiddleware.js';
import { isRecord } from '../utils/typeGuards.js';
import { cacheService } from '../utils/cacheService.js';

const router = Router();

const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many reviews submitted. Please try again later.' },
});

const ProductIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID');
const ReviewIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid review ID');
const ReviewInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(1000),
});

async function getReviewSummary(productId: Types.ObjectId) {
  const [summary] = await Review.aggregate<{
    averageRating: number;
    reviewCount: number;
  }>([
    { $match: { product: productId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  return {
    averageRating: summary ? Math.round(summary.averageRating * 10) / 10 : 0,
    reviewCount: summary?.reviewCount ?? 0,
  };
}

router.get('/admin/all', requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reviews = await Review.find()
      .populate<{ product: { _id: Types.ObjectId; name: string; slug: string } | null }>(
        'product',
        'name slug'
      )
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    res.json(
      reviews.map(({ _id, product, ...review }) => ({
        ...review,
        id: _id.toString(),
        product: product
          ? {
              id: product._id.toString(),
              name: product.name,
              slug: product.slug,
            }
          : null,
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.delete('/:reviewId', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedId = ReviewIdSchema.safeParse(req.params.reviewId);
    if (!parsedId.success) {
      throw new AppError('Invalid review ID', 400, 'INVALID_REVIEW_ID');
    }

    const review = await Review.findByIdAndDelete(parsedId.data);
    if (!review) {
      throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
    }

    const summary = await getReviewSummary(review.product);
    await Product.findByIdAndUpdate(review.product, {
      rating: summary.averageRating,
      reviewCount: summary.reviewCount,
    });
    cacheService.invalidatePattern('products:');

    res.json({ message: 'Review deleted', ...summary });
  } catch (error) {
    next(error);
  }
});

router.get('/:productId', authenticateIfPresent, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedId = ProductIdSchema.safeParse(req.params.productId);
    if (!parsedId.success) {
      throw new AppError('Invalid product ID', 400, 'INVALID_PRODUCT_ID');
    }

    const product = await Product.findById(parsedId.data).select('_id');
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    const [reviews, summary, existingReview] = await Promise.all([
      Review.find({ product: product._id })
        .select('customerName rating comment createdAt')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      getReviewSummary(product._id),
      req.user ? Review.exists({ product: product._id, user: req.user._id }) : null,
    ]);

    const canReview = Boolean(req.user) && !existingReview;

    res.json({
      reviews,
      ...summary,
      canReview,
      hasReviewed: Boolean(existingReview),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:productId', authenticate, reviewLimiter, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customer = req.user;
    if (!customer) {
      throw new AppError('Authentication token required', 401, 'NOT_AUTHORIZED');
    }

    const parsedId = ProductIdSchema.safeParse(req.params.productId);
    if (!parsedId.success) {
      throw new AppError('Invalid product ID', 400, 'INVALID_PRODUCT_ID');
    }

    const parsedReview = ReviewInputSchema.safeParse(req.body);
    if (!parsedReview.success) {
      throw new AppError('Enter a rating and a review between 10 and 1,000 characters.', 400, 'INVALID_REVIEW');
    }

    const product = await Product.findById(parsedId.data).select('_id');
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    const existingReview = await Review.exists({ product: product._id, user: customer._id });
    if (existingReview) {
      throw new AppError('You have already reviewed this product.', 409, 'DUPLICATE_REVIEW');
    }

    const review = new Review({
      product: product._id,
      user: customer._id,
      customerName: customer.name,
      rating: parsedReview.data.rating,
      comment: parsedReview.data.comment,
    });
    await review.save();

    const summary = await getReviewSummary(product._id);
    await Product.findByIdAndUpdate(product._id, {
      rating: summary.averageRating,
      reviewCount: summary.reviewCount,
    });
    cacheService.invalidatePattern('products:');

    res.status(201).json({
      review: {
        customerName: review.customerName,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      },
      ...summary,
      canReview: false,
      hasReviewed: true,
    });
  } catch (error) {
    if (isRecord(error) && error.code === 11000) {
      next(new AppError('You have already reviewed this product.', 409, 'DUPLICATE_REVIEW'));
      return;
    }
    next(error);
  }
});

export default router;
