const Coupon = require('../models/Coupon');
const asyncHandler = require('express-async-handler');

// @POST /api/coupons/apply  (any logged-in user)
exports.applyCoupon = asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;
  if (!code) { res.status(400); throw new Error('Coupon code is required'); }

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) { res.status(404); throw new Error('Invalid or expired coupon code'); }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    res.status(400); throw new Error('Coupon has expired');
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    res.status(400); throw new Error('Coupon usage limit reached');
  }
  if (orderAmount < coupon.minOrderAmount) {
    res.status(400); throw new Error(`Minimum order amount is PKR ${coupon.minOrderAmount}`);
  }

  const discount =
    coupon.discountType === 'percentage'
      ? Math.round(orderAmount * (coupon.discountValue / 100))
      : coupon.discountValue;

  res.json({
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discount,
    finalAmount: Math.max(0, orderAmount - discount),
  });
});

// @GET /api/coupons  (admin)
exports.getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json(coupons);
});

// @POST /api/coupons  (admin)
exports.createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json(coupon);
});

// @PUT /api/coupons/:id/toggle  (admin)
exports.toggleCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) { res.status(404); throw new Error('Coupon not found'); }
  coupon.isActive = !coupon.isActive;
  await coupon.save();
  res.json(coupon);
});

// @DELETE /api/coupons/:id  (admin)
exports.deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) { res.status(404); throw new Error('Coupon not found'); }
  await coupon.deleteOne();
  res.json({ message: 'Coupon deleted' });
});
