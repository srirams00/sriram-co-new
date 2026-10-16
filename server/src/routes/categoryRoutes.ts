import { Router, Request, Response } from 'express';
import { Category, ICategory } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { cacheService } from '../utils/cacheService.js';

const router = Router();

export interface CategoryResponse {
  id?: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  itemCount: number;
  [key: string]: unknown;
}

const CATEGORY_SLUG_ALIAS: Record<string, string> = {
  'cleaning': 'cleaning-appliances',
  'kitchen': 'kitchen-essentials',
  'power': 'power-tools',
  'powertools': 'power-tools',
  'garden': 'garden-outdoor',
  'personal': 'personal-care',
};

// GET /api/categories - List all categories
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    const cached = cacheService.get<CategoryResponse[]>('categories:all');
    if (cached) {
      res.json(cached);
      return;
    }

    const categories = await Category.find({}).sort({ name: 1 });
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({
          isArchived: { $ne: true },
          $or: [
            { categorySlug: cat.slug },
            { category: new RegExp(`^${cat.name}$`, 'i') },
          ],
        });
        const obj = cat.toJSON();
        obj.itemCount = count;
        return obj;
      })
    );

    cacheService.set('categories:all', categoriesWithCount, 60);
    res.json(categoriesWithCount);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving categories', error });
  }
});

// GET /api/categories/:slug - Single category by slug
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawSlug = req.params.slug.toLowerCase().trim();
    const resolvedSlug = CATEGORY_SLUG_ALIAS[rawSlug] || rawSlug;
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');

    const cacheKey = `categories:slug:${resolvedSlug}`;
    const cached = cacheService.get<CategoryResponse>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    let category = await Category.findOne({ slug: resolvedSlug });
    if (!category && resolvedSlug !== rawSlug) {
      category = await Category.findOne({ slug: rawSlug });
    }

    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    const count = await Product.countDocuments({
      isArchived: { $ne: true },
      $or: [
        { categorySlug: category.slug },
        { category: new RegExp(`^${category.name}$`, 'i') },
      ],
    });

    const categoryObj = category.toJSON();
    categoryObj.itemCount = count;

    cacheService.set(cacheKey, categoryObj, 60);
    res.json(categoryObj);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving category', error });
  }
});

export default router;
