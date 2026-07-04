const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');
const { saveBase64Image } = require('../utils/imageHandler');

// @GET /api/products
exports.getProducts = asyncHandler(async (req, res) => {
  const { keyword, category, minPrice, maxPrice, rating, page = 1, limit = 12, sort } = req.query;
  const query = { isApproved: true };
  if (keyword) query.$text = { $search: keyword };
  if (category) query.category = category;
  if (minPrice || maxPrice) query.price = { ...(minPrice && { $gte: Number(minPrice) }), ...(maxPrice && { $lte: Number(maxPrice) }) };
  if (rating) query.rating = { $gte: Number(rating) };
  const sortOptions = { newest: { createdAt: -1 }, priceAsc: { price: 1 }, priceDesc: { price: -1 }, rating: { rating: -1 } };
  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find(query).sort(sortOptions[sort] || { createdAt: -1 }).skip(skip).limit(Number(limit)).populate('seller', 'name'),
    Product.countDocuments(query)
  ]);
  res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// @GET /api/products/:id
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('seller', 'name email');
  if (!product) { res.status(404); throw new Error('Product not found'); }
  res.json(product);
});

// @POST /api/products
exports.createProduct = asyncHandler(async (req, res) => {
  let images = req.body.images || [];
  
  // Process base64 images
  images = images.map(img => {
    if (typeof img === 'string' && img.startsWith('data:image')) {
      const savedPath = saveBase64Image(img);
      return savedPath || img; // Use saved path if successful, otherwise keep original
    }
    return img; // Keep external URLs as-is
  }).filter(img => img); // Remove any null values
  
  if (images.length === 0) {
    res.status(400);
    throw new Error('At least one product image is required');
  }
  
  const product = await Product.create({ 
    ...req.body, 
    images,
    seller: req.user._id, 
    isApproved: req.user.role === 'admin' 
  });
  res.status(201).json(product);
});

// @PUT /api/products/:id
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorized');
  }
  
  let images = req.body.images || product.images;
  
  // Process base64 images
  images = images.map(img => {
    if (typeof img === 'string' && img.startsWith('data:image')) {
      const savedPath = saveBase64Image(img);
      return savedPath || img;
    }
    return img;
  }).filter(img => img);
  
  const updated = await Product.findByIdAndUpdate(
    req.params.id, 
    { ...req.body, images },
    { new: true }
  );
  res.json(updated);
});

// @DELETE /api/products/:id
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorized');
  }
  await product.deleteOne();
  res.json({ message: 'Product deleted' });
});

// @POST /api/products/:id/reviews
exports.addReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());
  if (alreadyReviewed) { res.status(400); throw new Error('Already reviewed'); }
  product.reviews.push({ user: req.user._id, name: req.user.name, rating: req.body.rating, comment: req.body.comment });
  product.numReviews = product.reviews.length;
  product.rating = product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length;
  await product.save();
  res.status(201).json({ message: 'Review added' });
});

// @GET /api/products/categories
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category');
  res.json(categories);
});

// @GET /api/products/featured
exports.getFeatured = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true, isApproved: true }).limit(8);
  res.json(products);
});

// @GET /api/products/my  (seller: own products, approved + pending)
exports.getMyProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 });
  res.json({ products });
});
