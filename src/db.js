const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.VITE_MONGO_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('[DB] No MongoDB URI found in environment variables (VITE_MONGO_URI or MONGO_URI)');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('[DB] Connected to MongoDB');
  } catch (error) {
    console.error('[DB] MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
