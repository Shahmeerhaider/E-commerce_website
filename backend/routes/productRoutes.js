const express = require('express');
const router = express.Router();
const { 
  getProducts, 
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  addReview, 
  getCategories, 
  getFeatured, 
  getMyProducts 
} = require('../controllers/productController');
const { protect, seller, admin } = require('../middleware/auth');
const Product = require('../models/Product');

// Public routes
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/featured', getFeatured);

// Protected routes - Seller only
router.get('/my', protect, seller, getMyProducts);
router.post('/', protect, seller, createProduct);
router.put('/:id', protect, seller, updateProduct);
router.delete('/:id', protect, seller, deleteProduct);

// Protected routes - Any authenticated user
router.post('/:id/reviews', protect, addReview);

// Admin route - Toggle featured status
router.patch('/:id/featured', protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }
    
    // Toggle the featured status
    product.isFeatured = !product.isFeatured;
    await product.save();
    
    res.json({ 
      success: true,
      data: product,
      message: product.isFeatured 
        ? 'Product marked as featured successfully' 
        : 'Product removed from featured successfully' 
    });
  } catch (error) {
    console.error('Error toggling featured status:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Server error while updating featured status' 
    });
  }
});

// Get single product - Keep this at the end to avoid route conflicts
router.get('/:id', getProduct);

module.exports = router;