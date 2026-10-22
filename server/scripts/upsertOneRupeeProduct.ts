import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Product } from '../src/models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sriram_and_co';

async function main() {
  console.log('Connecting to MongoDB Atlas with custom DNS (8.8.8.8)...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected successfully to MongoDB Atlas.');

  const productData = {
    name: '1 Rupee Verification Product',
    slug: '1-rupee-test-product',
    category: 'Cookware',
    categorySlug: 'cookware',
    shortDescription: 'Official ₹1 test SKU for live checkout and payment verification on review.sriramandco.in.',
    fullDescription: 'Official ₹1 test SKU for verifying live Razorpay checkout, webhook settlement, customer email notifications, and automated refund workflows on Sri Ram & Co.',
    price: 1,
    originalPrice: 10,
    image: '/logo.webp',
    additionalImages: ['/logo.webp'],
    badge: 'Popular' as const,
    inStock: true,
    inventoryCount: 999,
    sku: 'TEST-1RS-VERIFY',
    isArchived: false,
    rating: 5,
    reviewCount: 1,
    specifications: new Map([
      ['Purpose', 'Live Payment Gateway Verification'],
      ['Test Price', '₹1.00'],
      ['Store', 'Sri Ram & Co Trichy'],
    ]),
    features: [
      'Instant Razorpay Payment Verification',
      'Transactional Email Delivery Testing',
      'Pre-dispatch Cancellation Testing',
      '5-Day Store Replacement Policy',
    ],
  };

  const existing = await Product.findOne({ slug: productData.slug });
  if (existing) {
    Object.assign(existing, productData);
    await existing.save();
    console.log(`[OK] Updated existing ₹1 product: ${existing.name} (ID: ${existing._id}, Price: ₹${existing.price})`);
  } else {
    const created = await Product.create(productData);
    console.log(`[OK] Created new ₹1 product: ${created.name} (ID: ${created._id}, Price: ₹${created.price})`);
  }

  // Also query to confirm it is readable
  const verified = await Product.findOne({ slug: '1-rupee-test-product' });
  console.log('Verification query:', {
    id: verified?._id,
    name: verified?.name,
    price: verified?.price,
    inStock: verified?.inStock,
    slug: verified?.slug,
  });

  await mongoose.disconnect();
  console.log('MongoDB connection closed.');
}

main().catch((err) => {
  console.error('Failed to upsert ₹1 product:', err);
  process.exit(1);
});
