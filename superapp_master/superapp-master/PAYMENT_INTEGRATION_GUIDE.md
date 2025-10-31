# Complete Payment Integration Guide

## Overview
This guide provides step-by-step instructions to implement all payment methods (Pay Online, PhonePe, Bank, Card) using Razorpay so they work like Cash on Delivery. All payment methods will create orders that can be tracked in the rider app.

## Frontend Changes (Already Implemented)

### ✅ Updated Files:
1. **`src/services/paymentService.js`** - Enhanced to handle all payment methods
2. **`src/Clothes/Pages/PaymentEnhanced.jsx`** - Updated to pass correct payment method IDs
3. **`src/FoodDilvery/PagesF/PaymentFoodEnhanced.jsx`** - Updated for food delivery payments
4. **`src/config/api.config.js`** - Added payment endpoints

### ✅ Payment Methods Supported:
- **UPI Methods**: Paytm, PhonePe, Amazon Pay
- **Card Methods**: Credit/Debit Cards
- **Net Banking**: HDFC, ICICI, SBI, AXIS, Kotak
- **Wallets**: All wallet options
- **Cash on Delivery**: Already working

## Backend Changes Required

### 1. Environment Variables (.env)
```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_YOUR_TEST_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_TEST_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET

# For Production
# RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
# RAZORPAY_KEY_SECRET=YOUR_LIVE_KEY_SECRET
# RAZORPAY_WEBHOOK_SECRET=YOUR_LIVE_WEBHOOK_SECRET
```

### 2. Install Razorpay Package
```bash
npm install razorpay
```

### 3. Payment Routes (`/api/payments`)

#### Create Payment Routes File: `routes/payments.js`
```javascript
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const auth = require('../middleware/auth');

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
    const { amount, currency = 'INR', order_id, order_model, description, email, contact } = req.body;

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
        description: description
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
      payment_method: req.body.payment_method || 'razorpay',
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
```

### 4. Payment Model (`models/Payment.js`)
```javascript
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order_id: {
    type: String,
    required: true
  },
  razorpay_order_id: {
    type: String,
    required: true
  },
  razorpay_payment_id: {
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'captured', 'failed', 'refunded'],
    default: 'pending'
  },
  payment_method: {
    type: String,
    required: true
  },
  order_model: {
    type: String,
    required: true
  },
  captured_at: {
    type: Date
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
```

### 5. Update Order Models
Add payment_status field to all order models:

```javascript
// In Order, FoodOrder, GroceryOrder, Booking models
payment_status: {
  type: String,
  enum: ['pending', 'paid', 'failed', 'refunded'],
  default: 'pending'
}
```

### 6. Webhook Handler (Optional but Recommended)
```javascript
// routes/webhooks.js
router.post('/razorpay-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(body);
    
    if (event.event === 'payment.captured') {
      // Handle successful payment
      const payment = event.payload.payment.entity;
      await updatePaymentStatus(payment.id, 'captured');
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});
```

## Rider App Changes Required

### 1. Update Order Models
Add payment information to order models:

```javascript
// In your order models, add these fields:
payment_status: {
  type: String,
  enum: ['pending', 'paid', 'failed'],
  default: 'pending'
},
payment_method: {
  type: String,
  enum: ['cod', 'razorpay', 'paytm', 'phonepay', 'amazonpay', 'creditdebit', 'hdfc', 'icici', 'sbi', 'axis', 'kotak'],
  default: 'cod'
},
payment_id: {
  type: String
}
```

### 2. Update Order Creation Logic
Modify order creation to handle all payment methods:

```javascript
// In your order creation endpoints
const createOrder = async (req, res) => {
  try {
    const { payment_method, payment_id, ...orderData } = req.body;
    
    // Create order with payment information
    const order = new Order({
      ...orderData,
      payment_method: payment_method || 'cod',
      payment_status: payment_method === 'cod' ? 'pending' : 'paid',
      payment_id: payment_id || null,
      status: 'confirmed' // All orders start as confirmed
    });

    await order.save();

    // Send notification to riders (same for all payment methods)
    await notifyRiders(order);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

### 3. Update Rider App UI
Show payment method in order details:

```javascript
// In your order detail component
const OrderDetail = ({ order }) => {
  const getPaymentMethodText = (method) => {
    const methods = {
      'cod': 'Cash on Delivery',
      'razorpay': 'Online Payment',
      'paytm': 'Paytm',
      'phonepay': 'PhonePe',
      'amazonpay': 'Amazon Pay',
      'creditdebit': 'Credit/Debit Card',
      'hdfc': 'HDFC Net Banking',
      'icici': 'ICICI Net Banking',
      'sbi': 'SBI Net Banking',
      'axis': 'AXIS Net Banking',
      'kotak': 'Kotak Net Banking'
    };
    return methods[method] || method;
  };

  return (
    <div>
      <h3>Order Details</h3>
      <p>Order ID: {order._id}</p>
      <p>Payment Method: {getPaymentMethodText(order.payment_method)}</p>
      <p>Payment Status: {order.payment_status}</p>
      <p>Amount: ₹{order.total_amount}</p>
      
      {/* Show different actions based on payment method */}
      {order.payment_method === 'cod' ? (
        <button>Collect Cash: ₹{order.total_amount}</button>
      ) : (
        <div className="payment-confirmed">
          <span>✅ Payment Confirmed</span>
        </div>
      )}
    </div>
  );
};
```

### 4. Update Order Listings
Show payment status in order lists:

```javascript
// In your order list component
const OrderList = ({ orders }) => {
  return (
    <div>
      {orders.map(order => (
        <div key={order._id} className="order-card">
          <h4>Order #{order._id.slice(-6)}</h4>
          <p>Amount: ₹{order.total_amount}</p>
          <p>Payment: {getPaymentMethodText(order.payment_method)}</p>
          <span className={`status ${order.payment_status}`}>
            {order.payment_status === 'paid' ? '✅ Paid' : '💰 Collect Cash'}
          </span>
        </div>
      ))}
    </div>
  );
};
```

## Testing Instructions

### 1. Test Payment Methods
```javascript
// Test card numbers for Razorpay test mode:
// Success: 4111 1111 1111 1111
// Failure: 4000 0000 0000 0002
// Expiry: Any future date
// CVV: Any 3 digits
```

### 2. Test UPI
- Use any UPI ID in test mode
- Example: `test@razorpay`

### 3. Test Net Banking
- Use any test credentials provided by Razorpay

## Deployment Checklist

### Backend:
- [ ] Install Razorpay package
- [ ] Add environment variables
- [ ] Create payment routes
- [ ] Create payment model
- [ ] Update order models
- [ ] Test payment endpoints
- [ ] Deploy to production

### Rider App:
- [ ] Update order models
- [ ] Update order creation logic
- [ ] Update UI components
- [ ] Test with different payment methods
- [ ] Deploy to production

## Security Considerations

1. **Never expose Razorpay secret key** in frontend code
2. **Always verify payment signatures** on backend
3. **Use HTTPS** in production
4. **Implement webhook verification** for production
5. **Log all payment events** for debugging
6. **Handle payment failures** gracefully

## Support

For any issues:
1. Check Razorpay dashboard for payment status
2. Verify webhook configurations
3. Check server logs for errors
4. Test with Razorpay test credentials first

This implementation ensures that all payment methods work seamlessly and orders are properly tracked in the rider app, just like Cash on Delivery orders.
