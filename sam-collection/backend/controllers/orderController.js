const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const asyncHandler = require('express-async-handler');

const SHIPPING_FLAT_FEE = 250;
const TAX_RATE = 0.03;

// @POST /api/orders
exports.createOrder = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, couponCode } = req.body;
  if (!orderItems || orderItems.length === 0) { res.status(400); throw new Error('No order items'); }

  const productIds = orderItems.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } }).select('seller price');
  const productById = {};
  products.forEach((p) => { productById[p._id.toString()] = p; });

  const itemsWithSeller = orderItems.map((item) => {
    const product = productById[item.product?.toString()];
    return {
      ...item,
      price: product?.price ?? item.price,
      seller: product?.seller,
    };
  });

  const itemsPrice = itemsWithSeller.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingPrice = SHIPPING_FLAT_FEE;
  const taxPrice = Math.round(itemsPrice * TAX_RATE);
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  const order = await Order.create({
    user: req.user._id,
    orderItems: itemsWithSeller,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  });

  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity, sold: item.quantity } });
  }

  if (couponCode) {
    await Coupon.findOneAndUpdate({ code: couponCode.toUpperCase() }, { $inc: { usedCount: 1 } });
  }

  res.status(201).json(order);
});

// @GET /api/orders/myorders
exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('orderItems.product', 'name images');
  res.json(orders);
});

// @GET /api/orders/seller
exports.getSellerOrders = asyncHandler(async (req, res) => {
  const myProducts = await Product.find({ seller: req.user._id }).select('_id');
  const myProductIds = myProducts.map((p) => p._id);

  const orders = await Order.find({
    $or: [
      { 'orderItems.seller': req.user._id },
      { 'orderItems.product': { $in: myProductIds } },
    ],
  })
    .populate('user', 'name email')
    .populate({ path: 'orderItems.product', select: 'name images seller', populate: { path: 'seller', select: 'name' } })
    .sort({ createdAt: -1 });

  res.json(orders);
});

// @GET /api/orders/:id
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email').populate('orderItems.product', 'name images');
  if (!order) { res.status(404); throw new Error('Order not found'); }
  const isOwner = order.user._id.toString() === req.user._id.toString();
  const isSeller = order.orderItems.some((item) => item.seller && item.seller.toString() === req.user._id.toString());
  if (!isOwner && !isSeller && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorized');
  }
  res.json(order);
});

// @PUT /api/orders/:id/pay
exports.updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  order.isPaid = true;
  order.paidAt = Date.now();
  order.status = 'processing';
  order.paymentResult = { id: req.body.id, status: req.body.status, updateTime: req.body.update_time, email: req.body.payer?.email_address };
  const updated = await order.save();
  res.json(updated);
});

// @PUT /api/orders/:id/status  (admin or the seller who owns an item in this order)
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  if (req.user.role === 'seller') {
    const myProducts = await Product.find({ seller: req.user._id }).select('_id');
    const myProductIds = myProducts.map((p) => p._id.toString());

    // TEMP DEBUG — remove once the ownership mismatch is found
    console.log('--- updateOrderStatus debug ---');
    console.log('req.user._id:', req.user._id.toString());
    console.log('myProductIds:', myProductIds);
    console.log('order.orderItems:', JSON.stringify(order.orderItems, null, 2));

    const ownsItem = order.orderItems.some(
      (item) =>
        (item.seller && item.seller.toString() === req.user._id.toString()) ||
        myProductIds.includes(item.product?.toString())
    );

    console.log('ownsItem result:', ownsItem);
    console.log('--- end debug ---');

    if (!ownsItem) {
      res.status(403); throw new Error('Not authorized to update this order');
    }
  } else if (req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorized to update this order');
  }

  order.status = req.body.status;
  if (req.body.trackingNumber) order.trackingNumber = req.body.trackingNumber;

  if (req.body.status === 'delivered' && order.paymentMethod === 'COD' && !order.isPaid) {
    order.isPaid = true;
    order.paidAt = Date.now();
  }

  const updated = await order.save();
  res.json(updated);
});

// @GET /api/orders  (admin)
exports.getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate('user', 'name email')
    .populate('orderItems.seller', 'name')
    .populate({ path: 'orderItems.product', select: 'name seller', populate: { path: 'seller', select: 'name' } })
    .sort({ createdAt: -1 });
  res.json(orders);
});