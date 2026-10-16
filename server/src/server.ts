import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from './config/db';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestCorrelation } from './middleware/observability';

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
    allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature', 'x-from-cloudflare'],
  })
);
app.use(
  express.json({
    limit: '25mb',
    verify: (req: Request, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(requestCorrelation);
app.use(morgan('dev'));

// Origin shielding: reject direct requests that bypass Cloudflare in production
app.use((req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production' && process.env.CF_SECRET_TOKEN) {
    // Allow Razorpay direct webhooks, root status, or health checks to bypass
    if (req.path === '/api/payment/webhook' || req.path === '/api/health' || req.path === '/') {
      return next();
    }

    const incomingSecret = req.headers['x-from-cloudflare'];
    if (incomingSecret !== process.env.CF_SECRET_TOKEN) {
      return res.status(403).json({ error: 'Direct origin access forbidden.' });
    }
  }
  next();
});

// Health check endpoint with live database readiness and memory metrics
app.get('/api/health', (_req: Request, res: Response) => {
  const dbConnected = isDbConnected();
  const memory = process.memoryUsage();
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'degraded',
    database: dbConnected ? 'connected' : 'disconnected',
    service: 'Sriram & Co Backend API',
    uptime: Math.floor(process.uptime()),
    memory: {
      heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
      rssMb: Math.round(memory.rss / 1024 / 1024),
    },
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
const server = app.listen(PORT, () => {
  console.log(`🚀 Sriram & Co Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints active at http://localhost:${PORT}/api`);
});

// Graceful Shutdown Handler for Render, Docker, & Process Termination
const handleGracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('🔒 Closed incoming HTTP connections.');
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close(false);
        console.log('💾 MongoDB connection cleanly closed.');
      }
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during graceful shutdown:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 10s if connections refuse to close
  setTimeout(() => {
    console.error('⚠️  Graceful shutdown timed out after 10s. Forcing exit.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

export default app;
