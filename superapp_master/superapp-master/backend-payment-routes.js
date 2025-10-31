const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const auth = require('../middleware/auth'); // Adjust path as needed

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Get Razorpay public key
router.get('/razorpay-key', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        key_id: process.env.RAZORPAY_KEY_ID,
        test_mode: process.env.RAZORPAY_KEY_ID?.includes('test'),
        connectivity: 'success'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get Razorpay key',
      connectivity: 'failed'
    });
  }
});

// Create Razorpay order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { amount, currency = 'INR', order_id, order_model, description, email, contact, payment_method } = req.body;

    // Validate required fields
    if (!amount || !order_id || !order_model) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount, order_id, order_model'
      });
    }

    // Convert amount to paise (Razorpay expects amount in paise)
    const amountInPaise = Math.round(amount * 100);

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: currency,
      receipt: order_id,
      notes: {
        order_id: order_id,
        order_model: order_model,
        description: description,
        payment_method: payment_method
      }
    });

    // Create payment record in database
    const payment = await Payment.create({
      user_id: req.user.id,
      order_id: order_id,
      razorpay_order_id: razorpayOrder.id,
      amount: amount,
      currency: currency,
      status: 'pending',
      payment_method: payment_method || 'razorpay',
      order_model: order_model
    });

    res.json({
      success: true,
      data: {
        razorpayOrder,
        payment
      }
    });

  } catch (error) {
    console.error('Payment order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order'
    });
  }
});

// Verify payment signature
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, payment_id } = req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update payment record
    const payment = await Payment.findByIdAndUpdate(
      payment_id,
      {
        razorpay_payment_id,
        status: 'captured',
        captured_at: new Date()
      },
      { new: true }
    );

    // Update order status based on order model
    await updateOrderStatus(payment.order_id, payment.order_model, 'confirmed');

    res.json({
      success: true,
      data: {
        payment_id: payment._id,
        order_id: payment.order_id,
        amount: payment.amount,
        status: payment.status,
        payment_method: payment.payment_method
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
});

// Helper function to update order status
async function updateOrderStatus(orderId, orderModel, status) {
  try {
    switch (orderModel) {
      case 'Order':
        await Order.findByIdAndUpdate(orderId, { 
          status: status,
          payment_status: 'paid',
          updated_at: new Date()
        });
        break;
      case 'FoodOrder':
        await FoodOrder.findByIdAndUpdate(orderId, { 
          status: status,
          payment_status: 'paid',
          updated_at: new Date()
        });
        break;
      case 'GroceryOrder':
        await GroceryOrder.findByIdAndUpdate(orderId, { 
          status: status,
          payment_status: 'paid',
          updated_at: new Date()
        });
        break;
      case 'Booking':
        await Booking.findByIdAndUpdate(orderId, { 
          status: status,
          payment_status: 'paid',
          updated_at: new Date()
        });
        break;
      default:
        console.log('Unknown order model:', orderModel);
    }
  } catch (error) {
    console.error('Error updating order status:', error);
  }
}

module.exports = router;
