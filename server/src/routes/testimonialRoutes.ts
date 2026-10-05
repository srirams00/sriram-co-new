import { Router, Request, Response } from 'express';
import { Testimonial } from '../models/Testimonial';

const router = Router();

// GET /api/testimonials - List all customer testimonials
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const testimonials = await Testimonial.find({}).sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving testimonials', error });
  }
});

export default router;
