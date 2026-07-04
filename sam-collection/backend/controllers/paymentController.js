// controllers/paymentController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @POST /api/payment/create-intent
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'pkr' } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses smallest currency unit
      currency,
      metadata: { userId: req.user.id },
    });
    res.json({ success: true, clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
