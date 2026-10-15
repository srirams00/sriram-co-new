import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { Product } from '../models/Product';

export async function seedTestProduct(): Promise<void> {
  console.log('🌱 Seeding ₹1.00 Live Payment Test Product into MongoDB...');
  await connectDB();

  const testProductData = {
    name: 'Live Payment Test Item (₹1)',
    slug: 'live-payment-test-item',
    category: 'Kitchen Essentials',
    categorySlug: 'kitchen-essentials',
    shortDescription: '1 Rupee verification product for testing live Razorpay gateway and refund.',
    fullDescription: '1 Rupee verification product for testing live Razorpay gateway integration and instant refund on Sri Ram & Co.',
    price: 1,
    originalPrice: 10,
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&q=80',
    ],
    badge: 'New' as const,
    inStock: true,
    inventoryCount: 999,
    sku: 'TEST-1RS-LIVE',
    isArchived: false,
    rating: 5,
    reviewCount: 1,
    specifications: {
      'Purpose': 'Razorpay Live Mode Checkout Verification',
      'Refund Policy': 'Instant refund via Razorpay Dashboard',
      'Store Location': 'Vinola Complex, Trichy',
    },
    features: [
      'Razorpay Live Mode Gateway Testing',
      'Zero Delivery Fee Applied',
      'Immediate Order Confirmation Email',
      'Instant Refund Capable',
    ],
  };

  const product = await Product.findOneAndUpdate(
    { slug: 'live-payment-test-item' },
    { $set: testProductData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('✅ Test product upserted successfully:');
  console.log(`   ID: ${product._id}`);
  console.log(`   Name: ${product.name}`);
  console.log(`   Price: ₹${product.price}`);
  console.log(`   Slug: ${product.slug}`);

  await mongoose.disconnect();
  console.log('🔌 MongoDB disconnected.');
}

if (require.main === module) {
  seedTestProduct().catch((err) => {
    console.error('❌ Failed to seed test product:', err);
    process.exit(1);
  });
}
