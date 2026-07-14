// ============================================
// config/db.js
// MongoDB Connection using Mongoose
// ============================================

const mongoose = require('mongoose');

// Cache the connection across serverless invocations (Vercel reuses the
// process between "warm" requests, so we avoid reconnecting every time).
let cached = global._mongooseConn;
if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI)
      .then((conn) => {
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Don't process.exit here — that would kill the whole serverless
    // function process. Let the caller/error handler deal with it.
    throw error;
  }

  return cached.conn;
};

module.exports = connectDB;
