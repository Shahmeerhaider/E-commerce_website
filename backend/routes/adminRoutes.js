const express = require('express');
const router = express.Router();
const { getDashboard, getUsers, blockUser, approveProduct, getPendingProducts } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

router.get('/dashboard', protect, admin, getDashboard);
router.get('/users', protect, admin, getUsers);
router.put('/users/:id/block', protect, admin, blockUser);
router.get('/products/pending', protect, admin, getPendingProducts);
router.put('/products/:id/approve', protect, admin, approveProduct);

module.exports = router;
