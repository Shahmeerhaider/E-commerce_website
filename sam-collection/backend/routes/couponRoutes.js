const express = require('express');
const router = express.Router();
const { applyCoupon, getCoupons, createCoupon, toggleCoupon, deleteCoupon } = require('../controllers/couponController');
const { protect, admin } = require('../middleware/auth');

router.post('/apply', protect, applyCoupon);
router.get('/', protect, admin, getCoupons);
router.post('/', protect, admin, createCoupon);
router.put('/:id/toggle', protect, admin, toggleCoupon);
router.delete('/:id', protect, admin, deleteCoupon);

module.exports = router;
