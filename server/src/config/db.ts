import mongoose from 'mongoose';
import dns from 'dns';

export const isDbConnected = (): boolean => mongoose.connection.readyState === 1;

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sriram_and_co';

  // Fix for Node.js SRV resolution issue on Windows networks only
  if (process.platform === 'win32' && uri.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (e) {
      // Ignore if setServers fails
    }
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected. Waiting for reconnection...');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected successfully.');
  });

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ MongoDB Connection Error:', errorMsg);
    if (uri.includes('mongodb+srv://')) {
      console.warn('⚠️  Atlas Access Check: If deploying to cloud (Render/Vercel), ensure 0.0.0.0/0 is added to MongoDB Atlas Network Access.');
    }
  }
};
