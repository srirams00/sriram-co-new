import { Router, Request, Response } from 'express';
import { Category } from '../models/Category';

const router = Router();

// GET /api/categories - List all categories
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving categories', error });
  }
});

// GET /api/categories/:slug - Single category by slug
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving category', error });
  }
});

export default router;
