const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');

exports.getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name images price stock');
  res.json(cart || { items: [] });
});

exports.addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = await Product.findById(productId);
  if (!product || product.stock < quantity) { res.status(400); throw new Error('Product unavailable'); }
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
  const idx = cart.items.findIndex(i => i.product.toString() === productId);
  if (idx > -1) cart.items[idx].quantity += quantity;
  else cart.items.push({ product: productId, quantity, price: product.discountPrice || product.price });
  await cart.save();
  res.json(cart);
});

exports.updateCartItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  const item = cart.items.find(i => i._id.toString() === req.params.itemId);
  if (!item) { res.status(404); throw new Error('Item not found'); }
  item.quantity = req.body.quantity;
  await cart.save();
  res.json(cart);
});

exports.removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  cart.items = cart.items.filter(i => i._id.toString() !== req.params.itemId);
  await cart.save();
  res.json(cart);
});

exports.clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user._id });
  res.json({ message: 'Cart cleared' });
});
