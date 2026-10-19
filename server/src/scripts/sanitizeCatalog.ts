import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { Product } from '../models/Product';

export async function sanitizeCatalog(): Promise<void> {
  console.log('🧹 Connecting to MongoDB to sanitize product catalog...');
  await connectDB();

  // 1. Remove or archive Apple Airpods replica
  const replicaFilter = {
    $or: [
      { name: { $regex: /airpod/i } },
      { slug: { $regex: /airpod/i } },
      { _id: new mongoose.Types.ObjectId('6aca3ee9457cb8685f4bcaba') },
    ],
  };

  const replicaResult = await Product.deleteMany(replicaFilter);
  console.log(`🗑️ Removed ${replicaResult.deletedCount} replica product(s) (e.g. Apple Airpods).`);

  // 2. Remove or archive ₹1 test items
  const testItemFilter = {
    $or: [
      { slug: 'live-payment-test-item' },
      { price: { $lte: 1 } },
      { sku: 'TEST-1RS-LIVE' },
      { name: { $regex: /live payment test/i } },
    ],
  };

  const testResult = await Product.deleteMany(testItemFilter);
  console.log(`🗑️ Removed ${testResult.deletedCount} test payment product(s) (₹1 test items).`);

  // 3. Count remaining active catalog products
  const remainingCount = await Product.countDocuments({ isArchived: { $ne: true } });
  console.log(`✅ Catalog sanitized. ${remainingCount} genuine products active in database.`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
}

if (require.main === module) {
  sanitizeCatalog()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Sanitation error:', err);
      process.exit(1);
    });
}
