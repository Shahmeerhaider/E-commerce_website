const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  res.json(user.wishlist);
}));

router.post('/:productId', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const exists = user.wishlist.includes(req.params.productId);
  if (exists) user.wishlist = user.wishlist.filter(id => id.toString() !== req.params.productId);
  else user.wishlist.push(req.params.productId);
  await user.save();
  res.json({ wishlist: user.wishlist, added: !exists });
}));

module.exports = router;
