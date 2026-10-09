import { Router, Request, Response } from 'express';
import { Category } from '../models/Category';

const router = Router();

// In-memory cache for ultra-fast category lookups
let cachedCategories: any = null;
let categoriesCacheTime = 0;
const CACHE_TTL_MS = 120 * 1000; // 2 minutes

const slugCache = new Map<string, { data: any; expiry: number }>();

// GET /api/categories - List all categories
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
    const now = Date.now();
    if (cachedCategories && now - categoriesCacheTime < CACHE_TTL_MS) {
      res.json(cachedCategories);
      return;
    }

    const categories = await Category.find({}).sort({ name: 1 });
    cachedCategories = categories;
    categoriesCacheTime = now;
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving categories', error });
  }
});

// GET /api/categories/:slug - Single category by slug
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug;
    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');

    const cached = slugCache.get(slug);
    if (cached && Date.now() < cached.expiry) {
      res.json(cached.data);
      return;
    }

    const category = await Category.findOne({ slug });
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    slugCache.set(slug, { data: category, expiry: Date.now() + CACHE_TTL_MS });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving category', error });
  }
});

export default router;
