const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const mongoose = require('mongoose');

const seedInitialData = async () => {
  try {
    // Seed test products only if none exist
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      // Use a fake but valid ObjectId for seller
      const fakeSellerId = new mongoose.Types.ObjectId();
      
      const testProducts = [
        {
          name: 'Summer Dress',
          description: 'Beautiful summer dress perfect for warm weather',
          price: 2500,
          discountPrice: 1999,
          category: 'Dresses',
          brand: 'SAM',
          images: ['https://via.placeholder.com/500?text=Summer+Dress'],
          stock: 10,
          seller: fakeSellerId,
          isApproved: true,
          rating: 4.5,
          numReviews: 5
        },
        {
          name: 'Winter Coat',
          description: 'Warm winter coat with premium fabric',
          price: 5000,
          discountPrice: 3999,
          category: 'Coats',
          brand: 'SAM',
          images: ['https://via.placeholder.com/500?text=Winter+Coat'],
          stock: 8,
          seller: fakeSellerId,
          isApproved: true,
          rating: 4.8,
          numReviews: 12
        },
        {
          name: 'Casual Shirt',
          description: 'Comfortable casual shirt for everyday wear',
          price: 1500,
          discountPrice: 0,
          category: 'Shirts',
          brand: 'SAM',
          images: ['https://via.placeholder.com/500?text=Casual+Shirt'],
          stock: 15,
          seller: fakeSellerId,
          isApproved: true,
          rating: 4,
          numReviews: 8
        },
        {
          name: 'Denim Jeans',
          description: 'Classic denim jeans with perfect fit',
          price: 2000,
          discountPrice: 1599,
          category: 'Pants',
          brand: 'SAM',
          images: ['https://via.placeholder.com/500?text=Denim+Jeans'],
          stock: 20,
          seller: fakeSellerId,
          isApproved: true,
          rating: 4.6,
          numReviews: 18
        }
      ];

      await Product.insertMany(testProducts);
      console.log('✅ Test products seeded');
    }

    // Seed coupon
    const couponExists = await Coupon.findOne({ code: 'WELCOME20' });
    if (!couponExists) {
      await Coupon.create({
        code: 'WELCOME20',
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 0,
        isActive: true,
      });
      console.log('✅ WELCOME20 coupon seeded');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
};

module.exports = seedInitialData;
