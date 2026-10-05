import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Product } from '../models/Product';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Validation schema for query parameters
const ProductQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
  category: z.string().trim().optional(),
  query: z.string().trim().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sortBy: z.enum(['featured', 'price-low', 'price-high', 'rating']).optional(),
});

// GET /api/products/featured - Featured products
router.get('/featured', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await Product.find({
      $or: [{ badge: 'Best Seller' }, { badge: 'Top Rated' }],
    }).limit(8);

    if (products.length === 0) {
      const fallback = await Product.find({}).limit(8);
      res.json(fallback);
      return;
    }

    res.json(products);
  } catch (error) {
    next(error);
  }
});

// GET /api/products - Paginated product catalog with filtering & search
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = ProductQuerySchema.parse(req.query);
    const { page, limit, category, query, minPrice, maxPrice, sortBy } = parsed;

    const filter: Record<string, any> = {};

    if (category) {
      filter.categorySlug = category;
    }

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { shortDescription: { $regex: query, $options: 'i' } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sortBy === 'price-low') {
      sortOption = { price: 1 };
    } else if (sortBy === 'price-high') {
      sortOption = { price: -1 };
    } else if (sortBy === 'rating') {
      sortOption = { rating: -1 };
    }

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortOption).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:slug - Single product lookup
router.get('/:slug', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) {
      throw new AppError(`Product with slug '${req.params.slug}' not found`, 404, 'PRODUCT_NOT_FOUND');
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

export default router;
