import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { Product } from '../models/Product';
import { Category } from '../models/Category';

// Explicit product ID mapping for the 54 products
const PRODUCT_CATEGORY_MAP: Record<string, { category: string; categorySlug: string }> = {
  // Cleaning Appliances
  '6acb103115d1b53e70a1cf63': { category: 'Cleaning Appliances', categorySlug: 'cleaning-appliances' }, // Sink Cleaner
  '6acb0f6b15d1b53e70a1cf51': { category: 'Cleaning Appliances', categorySlug: 'cleaning-appliances' }, // Car Polish Liquid
  '6acb0d0815d1b53e70a1cf10': { category: 'Cleaning Appliances', categorySlug: 'cleaning-appliances' }, // Pad Mop
  '6acb0bb515d1b53e70a1cee3': { category: 'Cleaning Appliances', categorySlug: 'cleaning-appliances' }, // Washing Machine Radio
  '6acb0a3415d1b53e70a1cebf': { category: 'Cleaning Appliances', categorySlug: 'cleaning-appliances' }, // Clean Dirt Seperation Mop
  '6acaffcb6455b93c27da6422': { category: 'Cleaning Appliances', categorySlug: 'cleaning-appliances' }, // Gap Cleaner 3 Pies
  '6acafece6455b93c27da6410': { category: 'Cleaning Appliances', categorySlug: 'cleaning-appliances' }, // Pad Bucket Mop
  '6acafbc86455b93c27da63d4': { category: 'Cleaning Appliances', categorySlug: 'cleaning-appliances' }, // New Fan Duster
  '6acafa976455b93c27da63b0': { category: 'Cleaning Appliances', categorySlug: 'cleaning-appliances' }, // Sofa Cleaner
  '6aca4970457cb8685f4bcb5b': { category: 'Cleaning Appliances', categorySlug: 'cleaning-appliances' }, // Broom Wipper
  '6aca48b9457cb8685f4bcb49': { category: 'Cleaning Appliances', categorySlug: 'cleaning-appliances' }, // Magic Towel
  '6aca4609457cb8685f4bcb0a': { category: 'Cleaning Appliances', categorySlug: 'cleaning-appliances' }, // Toilet vaccum pipe
  '6aca45a0457cb8685f4bcb01': { category: 'Cleaning Appliances', categorySlug: 'cleaning-appliances' }, // Laundry Bag
  '6aca3d72457cb8685f4bcaa3': { category: 'Cleaning Appliances', categorySlug: 'cleaning-appliances' }, // Bucket Mop

  // Kitchen Essentials
  '6acb0fd815d1b53e70a1cf5a': { category: 'Kitchen Essentials', categorySlug: 'kitchen-essentials' }, // Gas Stover Silver 2 Burner
  '6acb0f1f15d1b53e70a1cf48': { category: 'Kitchen Essentials', categorySlug: 'kitchen-essentials' }, // Mirror Sicker
  '6acb0b4415d1b53e70a1ceda': { category: 'Kitchen Essentials', categorySlug: 'kitchen-essentials' }, // Forza Chopper 650 ML
  '6acb0af315d1b53e70a1ced1': { category: 'Kitchen Essentials', categorySlug: 'kitchen-essentials' }, // Mini Veg Cutter
  '6acb0a9415d1b53e70a1cec8': { category: 'Kitchen Essentials', categorySlug: 'kitchen-essentials' }, // VAccum Flask
  '6acb01c96455b93c27da644f': { category: 'Kitchen Essentials', categorySlug: 'kitchen-essentials' }, // Kitchen Sticker Wall
  '6acb01826455b93c27da6446': { category: 'Kitchen Essentials', categorySlug: 'kitchen-essentials' }, // Hiteh Bullet Mixi
  '6acaff306455b93c27da6419': { category: 'Kitchen Essentials', categorySlug: 'kitchen-essentials' }, // Electrical Juicer
  '6acafdef6455b93c27da63fe': { category: 'Kitchen Essentials', categorySlug: 'kitchen-essentials' }, // Hand Press Juicer
  '6acafc396455b93c27da63de': { category: 'Kitchen Essentials', categorySlug: 'kitchen-essentials' }, // Gas Lighter
  '6aca49f3457cb8685f4bcb64': { category: 'Kitchen Essentials', categorySlug: 'kitchen-essentials' }, // Kitchen Roll White
  '6aca4913457cb8685f4bcb52': { category: 'Kitchen Essentials', categorySlug: 'kitchen-essentials' }, // Akari Chopper
  '6aca4523457cb8685f4bcaf8': { category: 'Kitchen Essentials', categorySlug: 'kitchen-essentials' }, // Induction Stove
  '6aca3e5f457cb8685f4bcab1': { category: 'Kitchen Essentials', categorySlug: 'kitchen-essentials' }, // Dish Washer Brush

  // Power Tools
  '6acb0ecc15d1b53e70a1cf3f': { category: 'Power Tools', categorySlug: 'power-tools' }, // blower
  '6acafcd06455b93c27da63e7': { category: 'Power Tools', categorySlug: 'power-tools' }, // Leakage Tape
  '6aca4850457cb8685f4bcb40': { category: 'Power Tools', categorySlug: 'power-tools' }, // Osring 45W Bulb
  '6aca4784457cb8685f4bcb2e': { category: 'Power Tools', categorySlug: 'power-tools' }, // Water Heater Tripper
  '6aca46b4457cb8685f4bcb1c': { category: 'Power Tools', categorySlug: 'power-tools' }, // Saw Machine

  // Garden & Outdoor
  '6acb0e7915d1b53e70a1cf36': { category: 'Garden & Outdoor', categorySlug: 'garden-outdoor' }, // Akari Small
  '6acb0dd215d1b53e70a1cf22': { category: 'Garden & Outdoor', categorySlug: 'garden-outdoor' }, // Osring Bulb 25W
  '6acb0c8115d1b53e70a1cefe': { category: 'Garden & Outdoor', categorySlug: 'garden-outdoor' }, // Sunflower Fan
  '6acb0c0b15d1b53e70a1ceec': { category: 'Garden & Outdoor', categorySlug: 'garden-outdoor' }, // Akari Fan 12 Inch
  '6acb00b66455b93c27da6434': { category: 'Garden & Outdoor', categorySlug: 'garden-outdoor' }, // Noraml Mosquito Bat
  '6acb00446455b93c27da642b': { category: 'Garden & Outdoor', categorySlug: 'garden-outdoor' }, // Rowdy Speaker
  '6aca47ee457cb8685f4bcb37': { category: 'Garden & Outdoor', categorySlug: 'garden-outdoor' }, // Baby Fan Akari
  '6aca4710457cb8685f4bcb25': { category: 'Garden & Outdoor', categorySlug: 'garden-outdoor' }, // Solar light Single
  '6aca465f457cb8685f4bcb13': { category: 'Garden & Outdoor', categorySlug: 'garden-outdoor' }, // Mini Akari Light
  '6aca44c5457cb8685f4bcaef': { category: 'Garden & Outdoor', categorySlug: 'garden-outdoor' }, // Fm Radio
  '6aca4097457cb8685f4bcad5': { category: 'Garden & Outdoor', categorySlug: 'garden-outdoor' }, // Mini Mosquito Bat
  '6aca3fdc457cb8685f4bcacc': { category: 'Garden & Outdoor', categorySlug: 'garden-outdoor' }, // Mist Fan

  // Personal Care
  '6acb0e3a15d1b53e70a1cf2d': { category: 'Personal Care', categorySlug: 'personal-care' }, // HTC AT-522
  '6acb0d7315d1b53e70a1cf19': { category: 'Personal Care', categorySlug: 'personal-care' }, // Gun Massager
  '6acb010b6455b93c27da643d': { category: 'Personal Care', categorySlug: 'personal-care' }, // Boutique Towel
  '6acafe6c6455b93c27da6407': { category: 'Personal Care', categorySlug: 'personal-care' }, // 8 in 1 Massager
  '6acafd5e6455b93c27da63f5': { category: 'Personal Care', categorySlug: 'personal-care' }, // Vintage Trimmer
  '6acafb1b6455b93c27da63b9': { category: 'Personal Care', categorySlug: 'personal-care' }, // Neck Massager
  '6aca3f5f457cb8685f4bcac3': { category: 'Personal Care', categorySlug: 'personal-care' }, // Kemei Trimmer
  '6aca3ee9457cb8685f4bcaba': { category: 'Personal Care', categorySlug: 'personal-care' }, // Apple Airpods Black
  '6ac8d91d5297bc88913059cf': { category: 'Personal Care', categorySlug: 'personal-care' }, // Massager
};

const NAME_CATEGORY_RULES = [
  { test: /pruner|garden|irrigation|hose|lawn/i, category: 'Garden & Outdoor', slug: 'garden-outdoor' },
  { test: /hair dryer|groom|trimmer|shaver|massager|personal/i, category: 'Personal Care', slug: 'personal-care' },
  { test: /washer|vacuum|steam cleaner|mop|clean|duster|wiper/i, category: 'Cleaning Appliances', slug: 'cleaning-appliances' },
  { test: /drill|impact|saw|blower|power tool/i, category: 'Power Tools', slug: 'power-tools' },
  { test: /fryer|coffee|cooktop|mixer|grinder|cookware|kitchen/i, category: 'Kitchen Essentials', slug: 'kitchen-essentials' },
];

export async function runMigration() {
  await connectDB();
  console.log('🔄 Starting category migration for products...');

  const products = await Product.find({});
  console.log(`Found ${products.length} products to check and migrate.`);

  let updatedCount = 0;

  for (const product of products) {
    const id = product._id.toString();
    const mapped = PRODUCT_CATEGORY_MAP[id];

    if (mapped) {
      product.category = mapped.category;
      product.categorySlug = mapped.categorySlug;
      await product.save();
      updatedCount++;
      console.log(`✅ [${updatedCount}] Updated "${product.name}" -> ${mapped.category} (${mapped.categorySlug})`);
    } else {
      // Fallback rule matching for any products not in explicit list
      const matchedRule = NAME_CATEGORY_RULES.find(r => r.test.test(product.name));
      let targetCat = matchedRule ? matchedRule.category : 'Kitchen Essentials';
      let targetSlug = matchedRule ? matchedRule.slug : 'kitchen-essentials';

      if (!matchedRule) {
        const name = product.name.toLowerCase();
        const currentCat = (product.category || '').toLowerCase();

        if (
          name.includes('clean') ||
          name.includes('mop') ||
          name.includes('wiper') ||
          name.includes('duster') ||
          name.includes('vacuum') ||
          name.includes('towel') ||
          currentCat.includes('clean')
        ) {
          targetCat = 'Cleaning Appliances';
          targetSlug = 'cleaning-appliances';
        } else if (
          name.includes('trimmer') ||
          name.includes('massager') ||
          name.includes('groom') ||
          name.includes('shaver') ||
          name.includes('airpod')
        ) {
          targetCat = 'Personal Care';
          targetSlug = 'personal-care';
        } else if (
          name.includes('drill') ||
          name.includes('saw') ||
          name.includes('blower') ||
          name.includes('tape') ||
          name.includes('tool')
        ) {
          targetCat = 'Power Tools';
          targetSlug = 'power-tools';
        } else if (
          name.includes('fan') ||
          name.includes('light') ||
          name.includes('solar') ||
          name.includes('mosquito') ||
          name.includes('radio')
        ) {
          targetCat = 'Garden & Outdoor';
          targetSlug = 'garden-outdoor';
        }
      }

      product.category = targetCat;
      product.categorySlug = targetSlug;
      await product.save();
      updatedCount++;
      console.log(`⚡ [${updatedCount}] Auto-mapped "${product.name}" -> ${targetCat} (${targetSlug})`);
    }
  }

  // Update Category collection item counts
  console.log('📊 Updating Category item counts in DB...');
  const categories = await Category.find({});
  for (const cat of categories) {
    const count = await Product.countDocuments({
      isArchived: { $ne: true },
      $or: [
        { categorySlug: cat.slug },
        { category: new RegExp(`^${cat.name}$`, 'i') },
      ],
    });
    cat.itemCount = count;
    await cat.save();
    console.log(`📁 Category "${cat.name}" count: ${count}`);
  }

  console.log(`🎉 Migration complete! ${updatedCount} products updated successfully.`);
  await mongoose.connection.close();
}

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}
