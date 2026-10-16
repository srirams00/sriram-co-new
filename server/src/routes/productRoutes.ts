import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Product, IProduct } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.js';
import { cacheService } from '../utils/cacheService.js';

const router = Router();

// Helper to convert strings to clean URL slugs
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Canonical category slug mapping & aliasing
const CATEGORY_SLUG_MAP: Record<string, string> = {
  'cleaning appliances': 'cleaning-appliances',
  'cleaning-appliances': 'cleaning-appliances',
  'cleaning': 'cleaning-appliances',
  'kitchen essentials': 'kitchen-essentials',
  'kitchen-essentials': 'kitchen-essentials',
  'kitchen': 'kitchen-essentials',
  'power tools': 'power-tools',
  'power-tools': 'power-tools',
  'power': 'power-tools',
  'powertools': 'power-tools',
  'garden & outdoor': 'garden-outdoor',
  'garden and outdoor': 'garden-outdoor',
  'garden-outdoor': 'garden-outdoor',
  'garden': 'garden-outdoor',
  'personal care': 'personal-care',
  'personal-care': 'personal-care',
  'personal': 'personal-care',
};

function deriveCategorySlug(categoryName: string, explicitSlug?: string): string {
  if (explicitSlug && explicitSlug.trim()) {
    const slugNorm = explicitSlug.trim().toLowerCase();
    if (CATEGORY_SLUG_MAP[slugNorm]) return CATEGORY_SLUG_MAP[slugNorm];
    return slugify(explicitSlug);
  }
  const catNorm = categoryName.trim().toLowerCase();
  if (CATEGORY_SLUG_MAP[catNorm]) return CATEGORY_SLUG_MAP[catNorm];
  return slugify(categoryName);
}

// 24-character hexadecimal MongoDB ObjectId validator
const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

// Secure Image URL validator (HTTPS protocol, relative site asset paths, or base64 data URLs)
const ProductImageSchema = z.string().trim().refine(
  (val) =>
    /^https:\/\/.+/i.test(val) ||
    val.startsWith('/') ||
    /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,/i.test(val),
  { message: 'Image must use secure https://, local path, or valid image upload data' }
);

// Validation schema for query parameters
const ProductQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
  category: z.string().trim().optional(),
  query: z.string().trim().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sortBy: z.enum(['featured', 'price-low', 'price-high', 'rating']).optional(),
});

// Product input validation schema (create & update)
const ProductInputSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
  category: z.string().trim().min(2, 'Category is required'),
  categorySlug: z.string().trim().optional(),
  sku: z.string().trim().max(50).optional(),
  shortDescription: z.string().trim().min(5, 'Short description is required').max(300),
  fullDescription: z.string().trim().min(10, 'Full description is required'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  originalPrice: z.coerce.number().positive().nullable().optional(),
  image: ProductImageSchema,
  additionalImages: z.array(ProductImageSchema).optional().default([]),
  badge: z.enum(['Best Seller', 'New', 'Top Rated', 'Popular', 'Sale']).nullable().optional().or(z.literal('')),
  inStock: z.boolean().default(true),
  inventoryCount: z.coerce.number().int().nonnegative().default(15),
  specifications: z.record(z.string(), z.string()).optional().default({}),
  features: z.array(z.string().trim()).optional().default([]),
});

// GET /api/products/admin/stats - Aggregated metrics for admin dashboard
router.get('/admin/stats', requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [statsResult, distinctCategories] = await Promise.all([
      Product.aggregate([
        { $match: { isArchived: { $ne: true } } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            activeProducts: {
              $sum: { $cond: [{ $eq: ['$inStock', true] }, 1, 0] },
            },
            lowStockProducts: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gt: ['$inventoryCount', 0] },
                      { $lte: ['$inventoryCount', 5] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            totalCatalogValue: {
              $sum: {
                $multiply: [
                  '$price',
                  { $ifNull: ['$inventoryCount', 1] },
                ],
              },
            },
          },
        },
      ]),
      Product.distinct('category', { isArchived: { $ne: true } }),
    ]);

    const stats = statsResult[0] || {
      totalProducts: 0,
      activeProducts: 0,
      lowStockProducts: 0,
      totalCatalogValue: 0,
    };

    res.json({
      totalProducts: stats.totalProducts,
      activeProducts: stats.activeProducts,
      lowStockProducts: stats.lowStockProducts,
      categoriesCount: distinctCategories.length,
      totalCatalogValue: stats.totalCatalogValue,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/admin/all - Full catalog for admin management table
router.get('/admin/all', requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await Product.find({ isArchived: { $ne: true } }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// GET /api/products/id/:id - Single product lookup by MongoDB ID (for edit view)
router.get('/id/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedId = ObjectIdSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      throw new AppError('Invalid MongoDB ObjectId format', 400, 'INVALID_OBJECT_ID');
    }

    const product = await Product.findById(req.params.id);
    if (!product || product.isArchived) {
      throw new AppError(`Product not found`, 404, 'PRODUCT_NOT_FOUND');
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
});

// GET /api/products/featured - Featured products for storefront
router.get('/featured', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    const cached = cacheService.get<IProduct[]>('products:featured');
    if (cached) {
      res.json(cached);
      return;
    }

    const products = await Product.find({
      isArchived: { $ne: true },
      slug: { $ne: 'live-payment-test-item' },
      $or: [{ badge: 'Best Seller' }, { badge: 'Top Rated' }],
    }).limit(8);

    const result =
      products.length > 0
        ? products
        : await Product.find({ isArchived: { $ne: true }, slug: { $ne: 'live-payment-test-item' } }).limit(8);
    cacheService.set('products:featured', result, 60);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/products - Paginated product catalog with filtering & search
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = ProductQuerySchema.parse(req.query);
    const { page, limit, category, query, minPrice, maxPrice, sortBy } = parsed;

    const filter: Record<string, any> = {
      isArchived: { $ne: true },
      slug: { $ne: 'live-payment-test-item' },
    };

    if (category) {
      const normalizedSlug = category.toLowerCase().trim();
      const canonicalSlug = CATEGORY_SLUG_MAP[normalizedSlug] || normalizedSlug;
      const slugVariants = new Set<string>([normalizedSlug, canonicalSlug, category]);

      if (canonicalSlug === 'cleaning-appliances') {
        slugVariants.add('cleaning-appliances');
        slugVariants.add('cleaning');
      } else if (canonicalSlug === 'kitchen-essentials') {
        slugVariants.add('kitchen-essentials');
        slugVariants.add('kitchen');
      } else if (canonicalSlug === 'power-tools') {
        slugVariants.add('power-tools');
        slugVariants.add('power');
        slugVariants.add('powertools');
      } else if (canonicalSlug === 'garden-outdoor') {
        slugVariants.add('garden-outdoor');
        slugVariants.add('garden');
        slugVariants.add('outdoor');
      } else if (canonicalSlug === 'personal-care') {
        slugVariants.add('personal-care');
        slugVariants.add('personal');
      }

      filter.$or = [
        { categorySlug: { $in: Array.from(slugVariants) } },
        { category: new RegExp(`^${category.replace(/[-_]/g, ' ')}$`, 'i') },
        { category: new RegExp(`^${category}$`, 'i') },
      ];
    }

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { shortDescription: { $regex: query, $options: 'i' } },
        { sku: { $regex: query, $options: 'i' } },
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

// POST /api/products - Create a new product (Protected: Admin only)
router.post('/', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = ProductInputSchema.parse(req.body);

    // Auto-generate clean slug
    let baseSlug = slugify(validatedData.name);
    let finalSlug = baseSlug;
    let counter = 1;
    while (await Product.findOne({ slug: finalSlug })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Auto-derive category slug if not provided
    const categorySlug = deriveCategorySlug(validatedData.category, validatedData.categorySlug);

    // Auto-generate SKU if omitted
    const sku = validatedData.sku || `SRM-${baseSlug.slice(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const newProduct = new Product({
      ...validatedData,
      originalPrice: validatedData.originalPrice || undefined,
      badge: (validatedData.badge || undefined) as IProduct['badge'],
      slug: finalSlug,
      categorySlug,
      sku,
      rating: 0,
      reviewCount: 0,
    });

    await newProduct.save();
    cacheService.invalidatePattern('products:');
    cacheService.invalidatePattern('categories:');

    res.status(201).json(newProduct);
  } catch (error) {
    next(error);
  }
});

// PUT /api/products/:id - Update product details (Protected: Admin only)
router.put('/:id', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedId = ObjectIdSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      throw new AppError('Invalid MongoDB ObjectId format', 400, 'INVALID_OBJECT_ID');
    }

    const validatedData = ProductInputSchema.parse(req.body);

    const product = await Product.findById(req.params.id);
    if (!product || product.isArchived) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    // If name changed, optionally regenerate slug if needed
    if (product.name !== validatedData.name) {
      let baseSlug = slugify(validatedData.name);
      let finalSlug = baseSlug;
      let counter = 1;
      while (await Product.findOne({ slug: finalSlug, _id: { $ne: product._id } })) {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      product.slug = finalSlug;
    }

    product.name = validatedData.name;
    product.category = validatedData.category;
    product.categorySlug = deriveCategorySlug(validatedData.category, validatedData.categorySlug);
    product.sku = validatedData.sku || product.sku;
    product.shortDescription = validatedData.shortDescription;
    product.fullDescription = validatedData.fullDescription;
    product.price = validatedData.price;
    product.originalPrice = validatedData.originalPrice || undefined;
    product.image = validatedData.image;
    product.additionalImages = validatedData.additionalImages || [];
    product.badge = (validatedData.badge || undefined) as IProduct['badge'];
    product.inStock = validatedData.inStock;
    product.inventoryCount = validatedData.inventoryCount;
    product.specifications = validatedData.specifications || {};
    product.features = validatedData.features || [];

    await product.save();
    cacheService.invalidatePattern('products:');
    cacheService.invalidatePattern('categories:');

    res.json(product);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/products/:id/stock - Quick toggle stock / inventory (Protected: Admin only)
router.patch('/:id/stock', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedId = ObjectIdSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      throw new AppError('Invalid MongoDB ObjectId format', 400, 'INVALID_OBJECT_ID');
    }

    const { inStock, inventoryCount } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product || product.isArchived) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    if (typeof inStock === 'boolean') {
      product.inStock = inStock;
    }

    if (typeof inventoryCount === 'number' && inventoryCount >= 0) {
      product.inventoryCount = inventoryCount;
      if (inventoryCount === 0) {
        product.inStock = false;
      }
    }

    await product.save();
    cacheService.invalidatePattern('products:');
    cacheService.invalidatePattern('categories:');
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/products/:id - Delete product safely with active order check (Protected: Admin only)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedId = ObjectIdSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      throw new AppError('Invalid MongoDB ObjectId format', 400, 'INVALID_OBJECT_ID');
    }

    const product = await Product.findById(req.params.id);
    if (!product || product.isArchived) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    // Integrity check: Check if product is in active customer orders
    const activeOrderCount = await Order.countDocuments({
      'orderItems.product': req.params.id,
      orderStatus: { $in: ['placed', 'confirmed', 'processing', 'out_for_delivery'] },
    });

    if (activeOrderCount > 0) {
      throw new AppError(
        `Cannot delete product: it is part of ${activeOrderCount} active customer order(s). Toggle it out of stock instead.`,
        409,
        'PRODUCT_HAS_ACTIVE_ORDERS'
      );
    }

    // Soft delete or remove
    product.isArchived = true;
    product.inStock = false;
    await product.save();
    cacheService.invalidatePattern('products:');
    cacheService.invalidatePattern('categories:');

    res.json({ message: 'Product successfully removed from catalog', id: req.params.id });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:slug - Single product lookup by slug (for public store)
router.get('/:slug', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.params.slug === 'live-payment-test-item') {
      throw new AppError(`Product with slug '${req.params.slug}' not found`, 404, 'PRODUCT_NOT_FOUND');
    }
    const product = await Product.findOne({ slug: req.params.slug, isArchived: { $ne: true } });
    if (!product) {
      throw new AppError(`Product with slug '${req.params.slug}' not found`, 404, 'PRODUCT_NOT_FOUND');
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

export default router;
