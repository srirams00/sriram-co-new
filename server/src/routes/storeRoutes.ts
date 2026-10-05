import { Router, Request, Response } from 'express';
import { Store } from '../models/Store';

const router = Router();

// GET /api/stores - List all physical store locations
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const stores = await Store.find({}).sort({ isMainStore: -1 });
    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving store locations', error });
  }
});

export default router;
