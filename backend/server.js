const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const seedInitialData = require('./config/seed');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Connect MongoDB
connectDB()
.then(() => seedInitialData())
.catch((err) => {
console.error('Database connection failed:', err);
});

// Middleware
app.use(
cors({
origin: [
process.env.CLIENT_URL,
'http://localhost:3000'
].filter(Boolean),
credentials: true
})
);

// Raised from Express's 100kb default — product submissions carry
// compressed base64 images as JSON before they're uploaded to Cloudinary.
// Capped at 4mb: Vercel serverless functions hard-cap request bodies at
// 4.5mb regardless of what's set here, so there's no point going higher.
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb' }));

// Home Route
app.get('/', (req, res) => {
res.json({
success: true,
message: 'SAM Collection Backend Running'
});
});

// Health Check
app.get('/api/health', (req, res) => {
res.json({
status: 'ok',
message: 'SAS Collection API running'
});
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));

// Error Handler
app.use(errorHandler);

module.exports = app;
