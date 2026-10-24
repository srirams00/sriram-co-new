import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const NEW_ADMIN_EMAIL = process.env.ADMIN_INITIAL_EMAIL || process.env.ADMIN_EMAIL || 'admin.ops@sriramandco.in';
// Strong password configured via environment
const NEW_ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_PASSWORD;

if (!NEW_ADMIN_PASSWORD) {
  console.error('ERROR: ADMIN_INITIAL_PASSWORD must be configured in environment');
  process.exit(1);
}

async function updateAdmin() {
  if (!NEW_ADMIN_PASSWORD) {
    throw new Error('ADMIN_INITIAL_PASSWORD is required');
  }
  const password = NEW_ADMIN_PASSWORD;
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI || '');

  const usersCollection = mongoose.connection.collection('users');
  
  // Find existing admin or admin by email
  const existingAdmin = await usersCollection.findOne({
    $or: [{ role: 'admin' }, { email: 'admin@sriramandco.com' }]
  });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  if (existingAdmin) {
    console.log(`Found existing admin with id: ${existingAdmin._id}, updating...`);
    const result = await usersCollection.updateOne(
      { _id: existingAdmin._id },
      {
        $set: {
          email: NEW_ADMIN_EMAIL,
          name: 'Sri Ram & Co Admin Operations',
          password: hashedPassword,
          role: 'admin',
          failedLoginAttempts: 0,
          lockUntil: null,
          updatedAt: new Date()
        }
      }
    );
    console.log('Update result:', result);
  } else {
    console.log('No existing admin found, inserting new admin...');
    const result = await usersCollection.insertOne({
      email: NEW_ADMIN_EMAIL,
      name: 'Sri Ram & Co Admin Operations',
      password: hashedPassword,
      role: 'admin',
      phone: '+91 93454 03136',
      failedLoginAttempts: 0,
      lockUntil: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Insert result:', result);
  }

  // Verification step
  const updated = await usersCollection.findOne({ email: NEW_ADMIN_EMAIL });
  if (!updated) {
    throw new Error('Admin user was not found after update!');
  }
  const isMatch = await bcrypt.compare(password, updated.password);
  console.log('Password verification check:', isMatch ? 'PASSED ✅' : 'FAILED ❌');
  console.log('Admin account successfully updated with:');
  console.log('  Username / Email:', NEW_ADMIN_EMAIL);
  console.log('  Password:', password);

  await mongoose.disconnect();
}

updateAdmin().catch((err) => {
  console.error('Update failed:', err);
  process.exit(1);
});
