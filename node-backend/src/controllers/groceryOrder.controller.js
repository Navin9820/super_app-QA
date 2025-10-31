const GroceryOrder = require('../models/groceryorder');
const GroceryOrderItem = require('../models/groceryorderitem');
const User = require('../models/user');

// Get user's grocery orders
exports.getUserGroceryOrders = async (req, res) => {
  try {
    const userId = req.user.id;
  const orders = await GroceryOrder.find({ user_id: userId })
      .populate({
        path: 'items',
        populate: {
          path: 'product'  // ✅ FIX: Use 'product' instead of 'grocery_id'
        }
      })
      .populate('driver_info.driver_id', 'name phone vehicle_type vehicle_number')
      .sort({ createdAt: -1 });

    // Add OTP number to each order
    const ordersWithOtp = orders.map(order => {
      const orderObj = order.toObject();
      orderObj.otp_number = orderObj.payment_details?.delivery_otp?.code || null;
      return orderObj;
    });

    res.json({
      success: true,
      data: ordersWithOtp
    });
  } catch (error) {
    console.error('Error fetching grocery orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching grocery orders',
      error: error.message
    });
  }
};

// Get grocery order by ID
exports.getGroceryOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 getGroceryOrderById - User ID:', userId);
    console.log('🔍 getGroceryOrderById - Order ID:', req.params.id);
    
    const order = await GroceryOrder.findOne({ _id: req.params.id, user_id: userId })
      .populate({
        path: 'items',
        populate: {
          path: 'product'  // ✅ FIX: Use 'product' instead of 'grocery_id'
        }
      })
      .populate('driver_info.driver_id', 'name phone vehicle_type vehicle_number');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Grocery order not found'
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
    console.error('Error fetching grocery order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching grocery order',
      error: error.message
    });
  }
};

// ✅ ORIGINAL: Create grocery order with simple address (restored)
exports.createGroceryOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      items, 
      order_type,        // 🆕 NEW: Order type for tracking
      warehouse_id,      // 🆕 NEW: Warehouse ID for pickup address
      shipping_address,  // ✅ ORIGINAL: Simple address field
      delivery_address,  // ✅ ENHANCED: Optional detailed address
      delivery_instructions,
      preferred_delivery_time,
      packaging_preferences,
      special_requests,
      payment_method, 
      notes 
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required'
      });
    }

    // Prefer structured delivery_address; otherwise use provided shipping_address or fallback
    let address = shipping_address || null;
    if (!address && delivery_address && typeof delivery_address === 'object') {
      const parts = [
        delivery_address.address_line1,
        delivery_address.address_line2,
        delivery_address.city,
        delivery_address.state,
        delivery_address.pincode
      ].filter(Boolean);
      address = parts.length > 0 ? parts.join(', ') : null;
    }
    // Final fallback to a safe placeholder
    address = address || 'Address not available';

    // 1. Create the order first (without items)
    const orderData = {
      user_id: userId,
      order_number: `GORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order_type: order_type || 'grocery', // 🆕 NEW: Order type for tracking
      warehouse_id: warehouse_id, // 🆕 NEW: Warehouse ID for pickup address
      total_amount: 0, // will update after items
      address, // Simple string for rider display and quick queries
      delivery_address, // Detailed structured address for future use
      delivery_instructions,
      preferred_delivery_time: preferred_delivery_time ? new Date(preferred_delivery_time) : null,
      packaging_preferences,
      special_requests,
      payment_method: payment_method || 'cod',
      payment_status: 'pending',  // ✅ FIXED: Always start with pending
      notes,
      status: 'pending'
    };

    const order = new GroceryOrder(orderData);
    await order.save();


    // 2. Create order items, now with order._id
    let total = 0;
    const orderItems = [];
    for (const item of items) {
      const { grocery_id, quantity, price } = item;
      const itemPrice = (typeof price === 'number' && !isNaN(price)) ? price : 0;
      const itemTotal = itemPrice * quantity;
      total += itemTotal;

      const orderItem = new GroceryOrderItem({
        order_id: order._id,
        product_id: grocery_id, // This should match the grocery_id from frontend
        quantity,
        price: itemPrice
      });
      await orderItem.save();
      orderItems.push(orderItem._id);
    }

    // 3. Update order with items and total
    order.items = orderItems;
    order.total_amount = total;
    await order.save();


    // ✅ STEP 4: Create OrderAssignment for rider pickup
    const OrderAssignment = require('../models/orderAssignment');
    const orderAssignment = new OrderAssignment({
      order_id: order._id,
      order_type: 'grocery',  // ✅ CORRECT: Set as 'grocery'
      rider_id: null,         // Will be assigned when rider accepts
      status: 'assigned',
      assigned_at: new Date()
    });

    await orderAssignment.save();

    // ✅ STEP 5: Keep grocery orders as 'pending' initially (like food orders)
    // Status will be updated to 'confirmed' when rider accepts the order

    // ✅ STEP 6: Generate 6-digit OTP for all grocery orders
    const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    order.payment_details = {
      delivery_otp: {
        code: deliveryOtp,
        expiresAt,
        attempts_left: 5,
        resend_count: 0
      }
    };
    
    await order.save();
    console.log('✅ Grocery order OTP generated:', deliveryOtp);

    // ✅ STEP 7: Populate and return the created order
    const createdOrder = await GroceryOrder.findById(order._id)
      .populate({
        path: 'items',
        populate: {
          path: 'product'
        }
      });

    // ✅ Include OTP in response for frontend display
    const responseData = {
      ...createdOrder.toObject(),
      delivery_otp: createdOrder.payment_details?.delivery_otp?.code || null
    };

    res.status(201).json({
      success: true,
      message: 'Grocery order created successfully',
      data: responseData,
      orderAssignment: orderAssignment._id
    });
  } catch (error) {
    console.error('Error creating grocery order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating grocery order',
      error: error.message
    });
  }
};

// ✅ ENHANCED: Update grocery order status with tracking (optional feature)
exports.updateGroceryOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user.id;
    
    const order = await GroceryOrder.findOne({ 
      _id: req.params.id, 
      user_id: userId 
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Grocery order not found'
      });
    }

    // ✅ ENHANCED: Update tracking info if available (optional)
    if (order.tracking_info) {
      await order.updateTrackingInfo(status);
    }

    // ✅ FIXED: Update order status
    order.status = status;
    order.updated_at = new Date();
    await order.save();

    // ✅ FIXED: Update OrderAssignment status for rider integration
    try {
      const OrderAssignment = require('../models/orderAssignment');
      const assignment = await OrderAssignment.findOne({
        order_id: order._id,
        order_type: 'grocery'
      });

      if (assignment) {
        // Map grocery status to assignment status
        let assignmentStatus = 'assigned';
        switch (status) {
          case 'confirmed':
            assignmentStatus = 'assigned';
            break;
          case 'processing':
            assignmentStatus = 'accepted';
            break;
          case 'out_for_delivery':
            assignmentStatus = 'picked_up';
            break;
          case 'delivered':
            assignmentStatus = 'delivered';
            break;
          case 'cancelled':
            assignmentStatus = 'cancelled';
            break;
        }

        assignment.status = assignmentStatus;
        assignment.updated_at = new Date();
        await assignment.save();
        console.log(`✅ OrderAssignment status updated to ${assignmentStatus} for grocery order ${order._id}`);
      }
    } catch (assignmentError) {
      console.warn('⚠️ Could not update OrderAssignment:', assignmentError.message);
    }

    res.json({
      success: true,
      message: `Grocery order status updated to ${status}`,
      data: order
    });
  } catch (error) {
    console.error('Error updating grocery order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating grocery order status',
      error: error.message
    });
  }
};

// ✅ ENHANCED: Update delivery address (optional feature)
exports.updateDeliveryAddress = async (req, res) => {
  try {
    const { delivery_address } = req.body;
    const userId = req.user.id;
    
    // ✅ ENHANCED: Only validate if detailed address is provided
    if (delivery_address && (!delivery_address.address_line1 || !delivery_address.city || 
        !delivery_address.state || !delivery_address.pincode || !delivery_address.phone)) {
      return res.status(400).json({
        success: false,
        message: 'If providing detailed address, all fields are required'
      });
    }

    const order = await GroceryOrder.findOneAndUpdate(
      { _id: req.params.id, user_id: userId },
      { 
        delivery_address,
        updated_at: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Grocery order not found'
      });
    }

    res.json({
      success: true,
      message: 'Delivery address updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating delivery address:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating delivery address',
      error: error.message
    });
  }
};

// ✅ ENHANCED: Add delivery instructions (optional feature)
exports.addDeliveryInstructions = async (req, res) => {
  try {
    const { delivery_instructions, preferred_delivery_time, packaging_preferences, special_requests } = req.body;
    const userId = req.user.id;
    
    const updateData = {};
    if (delivery_instructions) updateData.delivery_instructions = delivery_instructions;
    if (preferred_delivery_time) updateData.preferred_delivery_time = new Date(preferred_delivery_time);
    if (packaging_preferences) updateData.packaging_preferences = packaging_preferences;
    if (special_requests) updateData.special_requests = special_requests;
    
    updateData.updated_at = new Date();

    const order = await GroceryOrder.findOneAndUpdate(
      { _id: req.params.id, user_id: userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Grocery order not found'
      });
    }

    res.json({
      success: true,
      message: 'Delivery instructions updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating delivery instructions:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating delivery instructions',
      error: error.message
    });
  }
};

// Cancel grocery order
exports.cancelGroceryOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cancellation_reason } = req.body;
    
    const order = await GroceryOrder.findOne({ _id: req.params.id, user_id: userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Grocery order not found'
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

    // ✅ ENHANCED: Add cancellation details if available
    order.status = 'cancelled';
    if (cancellation_reason) order.cancellation_reason = cancellation_reason;
    if (order.cancelled_by === undefined) order.cancelled_by = 'customer';
    order.updated_at = new Date();
    await order.save();

    res.json({
      success: true,
      message: 'Grocery order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Error cancelling grocery order:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling grocery order',
      error: error.message
    });
  }
};

// ✅ ENHANCED: Rate and review grocery order (optional feature)
exports.rateGroceryOrder = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const userId = req.user.id;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Valid rating (1-5) is required'
      });
    }

    const order = await GroceryOrder.findOne({ 
      _id: req.params.id, 
      user_id: userId,
      status: 'delivered' // Only allow rating for delivered orders
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Grocery order not found or not delivered'
      });
    }

    order.rating = rating;
    if (review) order.review = review;
    order.updated_at = new Date();
    await order.save();

    res.json({
      success: true,
      message: 'Rating and review added successfully',
      data: order
    });
  } catch (error) {
    console.error('Error adding rating and review:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding rating and review',
      error: error.message
    });
  }
};

// Get grocery order status
exports.getGroceryOrderStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const order = await GroceryOrder.findOne({ _id: req.params.id, user_id: userId })
      .select('status tracking_info delivery_address delivery_instructions address');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Grocery order not found'
      });
    }

    res.json({
      success: true,
      data: {
        status: order.status,
        address: order.address, // ✅ ORIGINAL: Primary address field
        tracking_info: order.tracking_info,
        delivery_address: order.delivery_address,
        delivery_instructions: order.delivery_instructions
      }
    });
  } catch (error) {
    console.error('Error fetching grocery order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching grocery order status',
      error: error.message
    });
  }
};

// ✅ ENHANCED: Get grocery orders by status (optional feature)
exports.getGroceryOrdersByStatus = async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const userId = req.user.id;
    
    const query = { user_id: userId };
    if (status) query.status = status;

    const orders = await GroceryOrder.find(query)
      .populate({
        path: 'items',
        populate: {
          path: 'product'
        }
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await GroceryOrder.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching grocery orders by status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching grocery orders by status',
      error: error.message
    });
  }
};

// ✅ ADMIN: Get all grocery orders (admin only)
exports.adminGetAllGroceryOrders = async (req, res) => {
  try {
    
    const { 
      page = 1, 
      limit = 20, 
      status, 
      search, 
      date_from, 
      date_to,
      payment_status,
      payment_method,
      sort_by = 'createdAt',
      sort_order = 'DESC'
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    if (status) query.status = status;
    if (payment_status) query.payment_status = payment_status;
    if (payment_method) query.payment_method = payment_method;
    
    // Date range filter
    if (date_from || date_to) {
      query.createdAt = {};
      if (date_from) query.createdAt.$gte = new Date(date_from);
      if (date_to) query.createdAt.$lte = new Date(date_to + ' 23:59:59');
    }


    // Check total orders in database
    const totalOrdersInDB = await GroceryOrder.countDocuments({});

    // First get orders
    let orders = await GroceryOrder.find(query)
      .populate({
        path: 'user',
        select: 'name email phone'
      })
      .populate({
        path: 'items',
        populate: {
          path: 'product'
        }
      })
      .sort({ [sort_by]: sort_order === 'DESC' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Search filter - handle after population
    if (search) {
      orders = orders.filter(order => 
        order.user && (
          order.user.name?.toLowerCase().includes(search.toLowerCase()) ||
          order.user.email?.toLowerCase().includes(search.toLowerCase()) ||
          order.user.phone?.includes(search) ||
          order.order_number?.toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    const total = await GroceryOrder.countDocuments(query);
    const totalPages = Math.ceil(total / limit);


    res.json({
      success: true,
      data: orders,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin grocery orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching grocery orders',
      error: error.message
    });
  }
};

// ✅ ADMIN: Update grocery order status (admin only)
exports.adminUpdateGroceryOrderStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const { id } = req.params;
    

    const order = await GroceryOrder.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Grocery order not found'
      });
    }

    // Update order status
    order.status = status;
    if (notes) order.notes = notes;
    order.updated_at = new Date();
    await order.save();

    // ✅ FIXED: Update OrderAssignment status for rider integration
    try {
      const OrderAssignment = require('../models/orderAssignment');
      const assignment = await OrderAssignment.findOne({
        order_id: order._id,
        order_type: 'grocery'
      });

      if (assignment) {
        // Map grocery status to assignment status
        let assignmentStatus = 'assigned';
        switch (status) {
          case 'confirmed':
            assignmentStatus = 'assigned';
            break;
          case 'processing':
            assignmentStatus = 'accepted';
            break;
          case 'out_for_delivery':
            assignmentStatus = 'picked_up';
            break;
          case 'delivered':
            assignmentStatus = 'delivered';
            break;
          case 'cancelled':
            assignmentStatus = 'cancelled';
            break;
        }

        assignment.status = assignmentStatus;
        assignment.updated_at = new Date();
        await assignment.save();
        console.log(`✅ OrderAssignment status updated to ${assignmentStatus} for grocery order ${order._id}`);
      }
    } catch (assignmentError) {
      console.warn('⚠️ Could not update OrderAssignment:', assignmentError.message);
    }

    res.json({
      success: true,
      message: `Grocery order status updated to ${status}`,
      data: order
    });
  } catch (error) {
    console.error('Error updating admin grocery order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating grocery order status',
      error: error.message
    });
  }
};
