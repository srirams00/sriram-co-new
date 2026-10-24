import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { Category } from './models/Category';
import { Product } from './models/Product';
import { Store } from './models/Store';
import { Testimonial } from './models/Testimonial';
import { User } from './models/User';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_STORES,
  INITIAL_TESTIMONIALS,
} from './data/initialData';

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting MongoDB database seeding process...');
    await connectDB();

    // Clean existing records
    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      Category.deleteMany({}),
      Product.deleteMany({}),
      Store.deleteMany({}),
      Testimonial.deleteMany({}),
      User.deleteMany({}),
    ]);
    console.log('✅ Collections cleared.');

    // Seed Categories
    console.log('📦 Seeding Categories...');
    const createdCategories = await Category.insertMany(INITIAL_CATEGORIES);
    console.log(`✅ Seeded ${createdCategories.length} categories.`);

    // Seed Products
    console.log('📦 Seeding Products...');
    const createdProducts = await Product.insertMany(INITIAL_PRODUCTS);
    console.log(`✅ Seeded ${createdProducts.length} products.`);

    // Seed Stores
    console.log('📦 Seeding Stores...');
    const createdStores = await Store.insertMany(INITIAL_STORES);
    console.log(`✅ Seeded ${createdStores.length} stores.`);

    // Seed Testimonials
    console.log('📦 Seeding Testimonials...');
    const createdTestimonials = await Testimonial.insertMany(INITIAL_TESTIMONIALS);
    console.log(`✅ Seeded ${createdTestimonials.length} testimonials.`);

    // Seed Default Users
    console.log('👤 Seeding Default Users (Admin & Customer)...');
    const adminEmail = process.env.ADMIN_INITIAL_EMAIL || process.env.ADMIN_EMAIL || 'admin.ops@sriramandco.in';
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_PASSWORD || 'SrC@2026!k9Q$mV7xP#4Wb8zL';
    const adminUser = new User({
      name: 'Sri Ram & Co Admin Operations',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      phone: '+91 93454 03136',
      address: {
        street: 'Bus Stop, 11, Vinola Complex, Thanjai Main Road, Oil Mill Rd',
        city: 'Tiruchirappalli',
        state: 'Tamil Nadu',
        postalCode: '620019',
        landmark: 'Near Oil Mill Bus Stop',
      },
    });
    await adminUser.save();

    const customerUser = new User({
      name: 'Priya Raman',
      email: 'customer@example.com',
      password: 'Customer123!',
      role: 'customer',
      phone: '+91 98765 43210',
      address: {
        street: '15, Anna Nagar 2nd Street',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600040',
        landmark: 'Near Roundtana',
      },
    });
    await customerUser.save();

    console.log('✅ Default users created:');
    console.log(`   - Admin: ${adminEmail} / ${adminPassword}`);
    console.log('   - Customer: customer@example.com / Customer123!');

    console.log('🎉 Database seeding completed successfully!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();
