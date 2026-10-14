import { Router, Request, Response } from 'express';
import { Category } from '../models/Category';
import { Product } from '../models/Product';

const router = Router();

// In-memory cache for ultra-fast category lookups
let cachedCategories: any = null;
let categoriesCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

const slugCache = new Map<string, { data: any; expiry: number }>();

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
    const now = Date.now();
    if (cachedCategories && now - categoriesCacheTime < CACHE_TTL_MS) {
      res.json(cachedCategories);
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

    cachedCategories = categoriesWithCount;
    categoriesCacheTime = now;
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

    const cached = slugCache.get(resolvedSlug);
    if (cached && Date.now() < cached.expiry) {
      res.json(cached.data);
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

    slugCache.set(resolvedSlug, { data: categoryObj, expiry: Date.now() + CACHE_TTL_MS });
    res.json(categoryObj);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving category', error });
  }
});

export default router;
