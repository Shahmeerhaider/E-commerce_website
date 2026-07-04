const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Forces Node to bypass your ISP's blocked DNS



require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const seedInitialData = require('./config/seed');
const { errorHandler } = require('./middleware/errorHandler');

// Connect to MongoDB then seed
connectDB().then(seedInitialData);

const app = express();
const path = require('path');

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for image uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'SAS Collection API running' }));

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
