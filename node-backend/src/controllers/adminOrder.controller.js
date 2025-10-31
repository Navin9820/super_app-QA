
const Order = require('../models/order');
const OrderItem = require('../models/orderitem');
const User = require('../models/user');
const Product = require('../models/product');
const ProductVariation = require('../models/productvariation');

// Get all orders with advanced filtering (admin)
exports.getAllOrders = async (req, res) => {
  console.log('ADMIN GET ALL ORDERS HIT', req.user);
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

    // Search filter - we'll handle this after population
    let userQuery = {};
    if (search) {
      userQuery = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // First get orders
    let orders = await Order.find(query)
      .populate({
        path: 'user',
        select: 'name email phone',
        match: userQuery
      })
      .populate('items')
      .sort({ [sort_by]: sort_order === 'DESC' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter out orders where user doesn't match search criteria
    if (search) {
      orders = orders.filter(order => order.user);
    }

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// Get single order by ID (admin)
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items')
      .populate('user', 'name email phone');

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
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

// Update order status (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, tracking_number, notes } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate status transition
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    order.status = status || order.status;
    order.tracking_number = tracking_number || order.tracking_number;
    order.notes = notes || order.notes;
    await order.save();

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
};

// Get order statistics (admin dashboard)
exports.getOrderStats = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Total orders
    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Total revenue
    const revenueResult = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total_amount' }
        }
      }
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.json({
      success: true,
      data: {
        total_orders: totalOrders,
        orders_by_status: ordersByStatus,
        total_revenue: totalRevenue
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: error.message
    });
  }
};

// Bulk update order statuses (admin)
exports.bulkUpdateOrders = async (req, res) => {
  try {
    const { order_ids, status, tracking_number, notes } = req.body;
    
    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order IDs array is required'
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (tracking_number) updateData.tracking_number = tracking_number;
    if (notes) updateData.notes = notes;

    const result = await Order.updateMany(
      { _id: { $in: order_ids } },
      updateData
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} orders successfully`,
      updated_count: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update orders',
      error: error.message
    });
  }
};

// Export orders (admin)
exports.exportOrders = async (req, res) => {
  try {
    const { status, date_from, date_to, format = 'json' } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (date_from || date_to) {
      query.createdAt = {};
      if (date_from) query.createdAt.$gte = new Date(date_from);
      if (date_to) query.createdAt.$lte = new Date(date_to + ' 23:59:59');
    }

    const orders = await Order.find(query)
      .populate('items')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = orders.map(order => ({
        'Order Number': order.order_number,
        'Customer': order.user?.name,
        'Email': order.user?.email,
        'Status': order.status,
        'Total Amount': order.total_amount,
        'Payment Method': order.payment_method,
        'Payment Status': order.payment_status,
        'Created Date': order.createdAt,
        'Items Count': order.items?.length || 0
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
      
      // Simple CSV conversion
      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');
      
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: orders,
        total: orders.length
      });
    }
  } catch (error) {
    console.error('Export orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export orders',
      error: error.message
    });
  }
}; 