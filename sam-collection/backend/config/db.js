// ============================================
// config/db.js
// MongoDB Connection using Mongoose
// ============================================

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Removed useNewUrlParser and useUnifiedTopology options to stop warnings
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
