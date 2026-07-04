const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getSellerOrders, getOrder, updateOrderToPaid, updateOrderStatus, getAllOrders } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/seller', protect, getSellerOrders);
router.get('/', protect, admin, getAllOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/pay', protect, updateOrderToPaid);
router.put('/:id/status', protect, updateOrderStatus);

module.exports = router;