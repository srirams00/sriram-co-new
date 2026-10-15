import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import { connectDB, isDbConnected } from './config/db';
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
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Connect to MongoDB
connectDB();

// Security and Performance Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(compression());

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server or curl/mobile requests without origin header
      if (!origin) {
        callback(null, true);
        return;
      }

      const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      // Strict domain matching for production and preview environments
      const isSriramDomain = /^https:\/\/(.*\.)?sriramandco\.(in|com)$/i.test(origin);

      // Strict Vercel preview domain pattern for Sriram deployments
      const isAllowedVercel = /^https:\/\/(sriram-and-co[a-z0-9-]*|sriram-co[a-z0-9-]*|review\.sriramandco)\.vercel\.app$/i.test(origin);

      if (allowedOrigins.includes(origin) || isLocal || isSriramDomain || isAllowedVercel) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature'],
  })
);
app.use(
  express.json({
    limit: '25mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const dbConnected = isDbConnected();
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'degraded',
    database: dbConnected ? 'connected' : 'disconnected',
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
