import mongoose from 'mongoose';

/**
 * Connect to MongoDB database using Mongoose scaffolding.
 * Prepares the application for user authentication and saved accounts.
 */
const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/passcraft';
    const conn = await mongoose.connect(connStr);
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB database (${error.message}). Continuing in offline mode.`);
  }
};

export default connectDB;
