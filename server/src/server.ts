import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Route imports
import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';
import storeRoutes from './routes/storeRoutes';
import testimonialRoutes from './routes/testimonialRoutes';
import orderRoutes from './routes/orderRoutes';
import authRoutes from './routes/authRoutes';

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Sriram & Co Backend API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/orders', orderRoutes);

// Root fallback
app.get('/', (_req: Request, res: Response) => {
  res.send('Sriram & Co API is operational. Visit /api/products, /api/categories, etc.');
});

// 404 handler for unknown routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 Sriram & Co Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints active at http://localhost:${PORT}/api`);
});

export default app;
