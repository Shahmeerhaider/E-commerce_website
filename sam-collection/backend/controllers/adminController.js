const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const asyncHandler = require('express-async-handler');

exports.getDashboard = asyncHandler(async (req, res) => {
  const [users, products, orders] = await Promise.all([
    User.countDocuments(), Product.countDocuments(), Order.countDocuments()
  ]);
  const revenue = await Order.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]);
  res.json({ users, products, orders, revenue: revenue[0]?.total || 0 });
});

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
});

exports.blockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  user.isBlocked = !user.isBlocked;
  await user.save();
  res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}` });
});

exports.approveProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
  res.json(product);
});

exports.getPendingProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isApproved: false }).populate('seller', 'name email');
  res.json(products);
});
