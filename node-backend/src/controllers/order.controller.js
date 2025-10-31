const Order = require('../models/order');
const OrderItem = require('../models/orderitem');
const Cart = require('../models/cart');
const CartItem = require('../models/cartitem');
const Product = require('../models/product');
const ProductVariation = require('../models/productvariation');
const User = require('../models/user');
const OrderAssignment = require('../models/orderAssignment');
const Rider = require('../models/rider');

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 getUserOrders - User ID from req.user:', userId);
    console.log('🔍 getUserOrders - Headers x-user-id:', req.headers['x-user-id']);
    console.log('🔍 getUserOrders - Is new user flag:', req.headers['x-is-new-user']);
    
    const orders = await Order.find({ user_id: userId })
      .populate({
        path: 'items',
        populate: [
          { 
            path: 'product_id', 
            model: 'Product',
            populate: [
              { path: 'category_id', model: 'Category' },
              { path: 'brand_id', model: 'Brand' }
            ]
          },
          { path: 'variation_id', model: 'ProductVariation' }
        ]
      })
      .populate('driver_info.driver_id', 'name phone vehicle_type vehicle_number')
      .sort({ createdAt: -1 });

    // Transform product images in order items and add OTP number to each order
    const ordersWithOtp = orders.map(order => {
      const orderObj = order.toObject();
      orderObj.otp_number = orderObj.payment_details?.delivery_otp?.code || null;
      
      // Transform product images in order items (same logic as cart controller)
      if (orderObj.items) {
        orderObj.items = orderObj.items.map(item => {
          if (item.product_id) {
            const product = item.product_id;
            // Apply the same image transformation logic as in product controller
            const transformedProduct = {
              ...product,
              // HYBRID APPROACH: Prioritize Base64 data from photo, then images array, then file paths
              photo: (product.photo && product.photo.startsWith('data:image/') ? product.photo : 
                      (product.images && product.images.length > 0 && product.images[0].startsWith('data:image/') ? product.images[0] : 
                       product.photo_path)) || (product.photo && product.photo.startsWith('/uploads/') ? product.photo : '/uploads/products/placeholder.jpg'),
              featured_image: (product.featured_image && product.featured_image.startsWith('data:image/') ? product.featured_image : product.photo_path) || (product.featured_image && product.featured_image.startsWith('/uploads/') ? product.featured_image : '/uploads/products/placeholder.jpg'),
              // Include all image fields for frontend
              photo_path: product.photo_path,
              images_paths: product.images_paths || [],
              images: product.images || [],
              images_count: product.images?.length || 0
            };
            item.product_id = transformedProduct;
          }
          return item;
        });
      }
      
      return orderObj;
    });

    res.json({
      success: true,
      data: ordersWithOtp
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const order = await Order.findOne({ _id: req.params.id, user_id: userId })
      .populate({
        path: 'items',
        populate: [
          { 
            path: 'product_id', 
            model: 'Product',
            populate: [
              { path: 'category_id', model: 'Category' },
              { path: 'brand_id', model: 'Brand' }
            ]
          },
          { path: 'variation_id', model: 'ProductVariation' }
        ]
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Transform product images in order items (same logic as cart controller)
    if (order && order.items) {
      order.items = order.items.map(item => {
        if (item.product_id) {
          const product = item.product_id;
          // Apply the same image transformation logic as in product controller
          const transformedProduct = {
            ...product.toObject(),
            // HYBRID APPROACH: Prioritize Base64 data from photo, then images array, then file paths
            photo: (product.photo && product.photo.startsWith('data:image/') ? product.photo : 
                    (product.images && product.images.length > 0 && product.images[0].startsWith('data:image/') ? product.images[0] : 
                     product.photo_path)) || (product.photo && product.photo.startsWith('/uploads/') ? product.photo : '/uploads/products/placeholder.jpg'),
            featured_image: (product.featured_image && product.featured_image.startsWith('data:image/') ? product.featured_image : product.photo_path) || (product.featured_image && product.featured_image.startsWith('/uploads/') ? product.featured_image : '/uploads/products/placeholder.jpg'),
            // Include all image fields for frontend
            photo_path: product.photo_path,
            images_paths: product.images_paths || [],
            images: product.images || [],
            images_count: product.images?.length || 0
          };
          item.product_id = transformedProduct;
        }
        return item;
      });
    }

    // Add OTP number to order details
    const orderObj = order.toObject();
    orderObj.otp_number = orderObj.payment_details?.delivery_otp?.code || null;

    res.json({
      success: true,
      data: orderObj
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// Create order from cart
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 CREATE ORDER DEBUG - User ID from req.user:', userId);
    console.log('🔍 CREATE ORDER DEBUG - Headers x-user-id:', req.headers['x-user-id']);
    console.log('🔍 CREATE ORDER DEBUG - Is new user flag:', req.headers['x-is-new-user']);
    const { shipping_address, payment_method, notes } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user_id: userId })
      .populate({
        path: 'items',
        populate: [
          { path: 'product_id', model: 'Product' },
          { path: 'variation_id', model: 'ProductVariation' }
        ]
      });

    console.log('🔍 CREATE ORDER DEBUG - Cart found:', !!cart);
    console.log('🔍 CREATE ORDER DEBUG - Cart items count:', cart?.items?.length || 0);
    console.log('🔍 CREATE ORDER DEBUG - Cart items:', cart?.items?.map(item => ({ id: item._id, product: item.product_id?.name, quantity: item.quantity })) || []);

    if (!cart || !cart.items || cart.items.length === 0) {
      console.log('🔍 CREATE ORDER DEBUG - Cart is empty, returning error');
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Calculate order totals and prepare cart item data
    let subtotal = 0;
    const cartItemsData = [];

    for (const cartItem of cart.items) {
      const product = cartItem.product_id;
      // Use sale_price if available, otherwise use regular price
      const itemPrice = product.sale_price || product.price;
      const itemTotal = itemPrice * cartItem.quantity;
      subtotal += itemTotal;

      // Store cart item data for later OrderItem creation
      cartItemsData.push({
        product_id: product._id,
        variation_id: cartItem.variation_id || null,
        quantity: cartItem.quantity,
        price: itemPrice, // Store the actual price used (sale_price or price)
        total_price: itemTotal
      });
    }

    // Calculate final amounts
    const tax_amount = 0; // No tax for now
    const shipping_amount = 0; // Free shipping
    const discount_amount = 0; // No discount
    const total_amount = subtotal + tax_amount + shipping_amount - discount_amount;

    // ✅ STEP 1: Create and save the Order FIRST with all required fields
    const order = new Order({
      user_id: userId,
      order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      subtotal: subtotal, // ✅ Required field added
      tax_amount: tax_amount,
      shipping_amount: shipping_amount,
      discount_amount: discount_amount,
      total_amount: total_amount, // ✅ Required field
      shipping_address,
      payment_method: payment_method || 'cod',
      status: 'pending',
      notes,
      // ✅ NEW: Include customer information for rider app
      customer_name: req.user.name,
      customer_phone: shipping_address?.phone || req.user.phone || 'N/A',
      customer_email: req.user.email
    });


    // ✅ STEP 1.5: Generate Delivery OTP for ALL orders (not just COD)
    const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    order.payment_details = {
      delivery_otp: {
        code: deliveryOtp,
        expiresAt,
        attempts_left: 5,
        resend_count: 0
      }
    };


    await order.save();

    // ✅ STEP 2: Now create OrderItems with the Order ID
    const orderItems = [];
    for (const itemData of cartItemsData) {
      const orderItem = new OrderItem({
        order_id: order._id, // ✅ Now we have the Order ID!
        product_id: itemData.product_id,
        variation_id: itemData.variation_id,
        quantity: itemData.quantity,
        price: itemData.price,
        total_price: itemData.total_price
      });
      await orderItem.save();
      orderItems.push(orderItem._id);
    }

    // ✅ STEP 3: OrderItems created successfully (no need to update order since items is virtual)

    // Clear cart
    await CartItem.deleteMany({ cart_id: cart._id });
    cart.items = [];
    await cart.save();

    // Auto-confirm for dispatch (do not mark COD as paid)
    try {
      order.status = 'confirmed';
      await order.save();
    } catch (e) {
      console.warn('⚠️ Could not auto-confirm order:', e.message);
    }

    // Return created order with populated items
    const createdOrder = await Order.findById(order._id)
      .populate({
        path: 'items',
        populate: [
          { 
            path: 'product_id', 
            model: 'Product',
            populate: [
              { path: 'category_id', model: 'Category' },
              { path: 'brand_id', model: 'Brand' }
            ]
          },
          { path: 'variation_id', model: 'ProductVariation' }
        ]
      });

    // Transform product images in order items (same logic as cart controller)
    if (createdOrder && createdOrder.items) {
      createdOrder.items = createdOrder.items.map(item => {
        if (item.product_id) {
          const product = item.product_id;
          // Apply the same image transformation logic as in product controller
          const transformedProduct = {
            ...product.toObject(),
            // HYBRID APPROACH: Prioritize Base64 data from photo, then images array, then file paths
            photo: (product.photo && product.photo.startsWith('data:image/') ? product.photo : 
                    (product.images && product.images.length > 0 && product.images[0].startsWith('data:image/') ? product.images[0] : 
                     product.photo_path)) || (product.photo && product.photo.startsWith('/uploads/') ? product.photo : '/uploads/products/placeholder.jpg'),
            featured_image: (product.featured_image && product.featured_image.startsWith('data:image/') ? product.featured_image : product.photo_path) || (product.featured_image && product.featured_image.startsWith('/uploads/') ? product.featured_image : '/uploads/products/placeholder.jpg'),
            // Include all image fields for frontend
            photo_path: product.photo_path,
            images_paths: product.images_paths || [],
            images: product.images || [],
            images_count: product.images?.length || 0
          };
          item.product_id = transformedProduct;
        }
        return item;
      });
    }

    // Prepare response data
    const responseData = {
      ...createdOrder.toObject(),
      // Include Delivery OTP in response for all orders
      delivery_otp: createdOrder.payment_details?.delivery_otp?.code || null
    };


    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: responseData
    });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Request body:', req.body);
    console.error('❌ User ID:', req.user?.id);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const order = await Order.findOne({ _id: req.params.id, user_id: userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled'
      });
    }

    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order that has been shipped or delivered'
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};

// Get order status
exports.getOrderStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const order = await Order.findOne({ _id: req.params.id, user_id: userId })
      .select('status order_number total_amount createdAt');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order status',
      error: error.message
    });
  }
}; 

// Confirm order for dispatch (admin or owner). For COD, marks as confirmed and paid for dispatching.
exports.confirmForDispatch = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only admin or owner can confirm
    if (req.user.role !== 'admin' && String(order.user_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to confirm this order' });
    }

    order.status = 'confirmed';
    // For COD, keep payment_status pending until rider collects cash (OTP-verified)
    await order.save();

    res.json({ success: true, message: 'Order confirmed for dispatch', data: order });
  } catch (error) {
    console.error('Error confirming order for dispatch:', error);
    res.status(500).json({ success: false, message: 'Error confirming order for dispatch', error: error.message });
  }
};

// Get delivery assignment for an order (customer view)
exports.getOrderAssignment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only admin or owner can view
    if (req.user.role !== 'admin' && String(order.user_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    const assignment = await OrderAssignment.findOne({ order_id: order._id, order_type: 'ecommerce' })
      .populate('rider', 'name phone current_location vehicle_type');

    res.json({ success: true, data: assignment || null });
  } catch (error) {
    console.error('Error fetching order assignment:', error);
    res.status(500).json({ success: false, message: 'Error fetching order assignment', error: error.message });
  }
};

// Get current COD OTP (in-app) for customer to view
exports.getCodOtp = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (req.user.role !== 'admin' && String(order.user_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }
    if (order.payment_method !== 'cod') {
      return res.status(400).json({ success: false, message: 'Not a COD order' });
    }
    const details = order.payment_details || {};
    const otpInfo = details.cod_otp;
    if (!otpInfo) return res.status(404).json({ success: false, message: 'COD OTP not generated yet' });
    return res.json({ success: true, data: {
      code: otpInfo.code,
      expiresAt: otpInfo.expiresAt,
      attempts_left: otpInfo.attempts_left ?? 0,
      resend_count: otpInfo.resend_count ?? 0
    }});
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching COD OTP', error: error.message });
  }
};

// Resend COD OTP (regenerate) - limited retries
exports.resendCodOtp = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (req.user.role !== 'admin' && String(order.user_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this order' });
    }
    if (order.payment_method !== 'cod') {
      return res.status(400).json({ success: false, message: 'Not a COD order' });
    }
    const details = order.payment_details || {};
    const otpInfo = details.cod_otp || {};
    const resendCount = otpInfo.resend_count || 0;
    if (resendCount >= 3) {
      return res.status(400).json({ success: false, message: 'Resend limit reached' });
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    details.cod_otp = {
      code,
      expiresAt,
      attempts_left: 5,
      resend_count: resendCount + 1
    };
    order.payment_details = details;
    await order.save();
    return res.json({ success: true, message: 'OTP regenerated', data: {
      code: details.cod_otp.code,
      expiresAt: details.cod_otp.expiresAt,
      attempts_left: details.cod_otp.attempts_left,
      resend_count: details.cod_otp.resend_count
    }});
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error resending COD OTP', error: error.message });
  }
};