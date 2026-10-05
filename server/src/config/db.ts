import mongoose from 'mongoose';
import dns from 'dns';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sriram_and_co';

  // Fix for Node.js SRV resolution issue on Windows networks
  if (uri.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (e) {
      // Ignore if setServers fails
    }
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error: any) {
    console.error('❌ MongoDB Connection Error:', error.message || error);
    if (uri.includes('mongodb+srv://') && error.message?.includes('auth')) {
      console.warn('⚠️  Atlas Authentication Failed. Please verify your Atlas credentials in server/.env, or switch to local MongoDB at mongodb://127.0.0.1:27017/sriram_and_co');
    }
  }
};
