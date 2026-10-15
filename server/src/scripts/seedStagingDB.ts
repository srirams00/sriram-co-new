import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import dns from 'dns';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Store } from '../models/Store';
import { Testimonial } from '../models/Testimonial';
import { User } from '../models/User';
import { Order } from '../models/Order';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_STORES,
  INITIAL_TESTIMONIALS,
} from '../data/initialData';

const STAGING_MONGO_URI =
  process.env.STAGING_MONGO_URI ||
  'mongodb+srv://rmramkumar1989_db_user:9sfpWzAlCwjPRAzn@sriramandco.bouowwo.mongodb.net/sriram_and_co_staging?appName=Sriramandco';

export async function createAndSeedStagingDB(): Promise<void> {
  console.log('🚀 Connecting to MongoDB Atlas to create and seed STAGING database (sriram_and_co_staging)...');

  // Fix Windows DNS SRV resolution for MongoDB Atlas
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {
    // Ignore if setServers fails
  }

  const conn = await mongoose.connect(STAGING_MONGO_URI);
  console.log(`✅ Connected to Staging Database: ${conn.connection.host}/${conn.connection.name}`);

  console.log('🧹 Clearing any existing staging collections...');
  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    Store.deleteMany({}),
    Testimonial.deleteMany({}),
    User.deleteMany({}),
    Order.deleteMany({}),
  ]);
  console.log('✅ Collections reset.');

  console.log('📦 Seeding Categories into Staging...');
  const categories = await Category.insertMany(INITIAL_CATEGORIES);
  console.log(`✅ Seeded ${categories.length} categories.`);

  console.log('📦 Seeding Products into Staging...');
  const products = await Product.insertMany(INITIAL_PRODUCTS);
  console.log(`✅ Seeded ${products.length} catalog products.`);

  console.log('📦 Seeding ₹1.00 Live Payment Test Item into Staging...');
  const testProduct = new Product({
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
    badge: 'New',
    inStock: true,
    inventoryCount: 999,
    sku: 'TEST-1RS-LIVE',
    isArchived: false,
    rating: 5,
    reviewCount: 1,
    specifications: {
      'Purpose': 'Razorpay Live Checkout Verification',
      'Refund Policy': 'Instant refund via Razorpay Dashboard',
      'Store Location': 'Vinola Complex, Trichy',
    },
    features: [
      'Razorpay Live Mode Gateway Testing',
      'Zero Delivery Fee Applied',
      'Immediate Order Confirmation Email',
      'Instant Refund Capable',
    ],
  });
  await testProduct.save();
  console.log(`✅ Seeded ₹1 test product with ID: ${testProduct._id}`);

  console.log('📦 Seeding Stores into Staging...');
  const stores = await Store.insertMany(INITIAL_STORES);
  console.log(`✅ Seeded ${stores.length} store locations.`);

  console.log('📦 Seeding Testimonials into Staging...');
  const testimonials = await Testimonial.insertMany(INITIAL_TESTIMONIALS);
  console.log(`✅ Seeded ${testimonials.length} testimonials.`);

  console.log('👤 Seeding Staging Administrator and Customer...');
  const adminUser = new User({
    name: 'Sriram Admin',
    email: 'admin@sriramandco.com',
    password: 'AdminPassword123!',
    role: 'admin',
    phone: '+91 93454 03136',
    address: {
      street: 'No. 11, vinola Complex, Thanjai Main Road',
      city: 'Trichy',
      state: 'Tamil Nadu',
      postalCode: '620014',
      landmark: 'Near oil Mill Bus stop',
    },
  });
  await adminUser.save();

  const customerUser = new User({
    name: 'Test Customer',
    email: 'customer@example.com',
    password: 'Customer123!',
    role: 'customer',
    phone: '+91 98765 43210',
    address: {
      street: '123 Main Road',
      city: 'Trichy',
      state: 'Tamil Nadu',
      postalCode: '620001',
    },
  });
  await customerUser.save();
  console.log('✅ Seeded admin and customer users.');

  console.log('🛒 Staging orders collection initialized at 0 orders.');

  await mongoose.disconnect();
  console.log('🎉 Staging database (sriram_and_co_staging) successfully created and seeded on MongoDB Atlas!');
}

if (require.main === module) {
  createAndSeedStagingDB().catch((err) => {
    console.error('❌ Failed to seed staging database:', err);
    process.exit(1);
  });
}
