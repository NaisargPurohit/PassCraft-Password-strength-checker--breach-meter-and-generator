import mongoose from 'mongoose';

/**
 * Connect to MongoDB instance using Mongoose.
 */
const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/passcraft';
    const conn = await mongoose.connect(connStr);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
