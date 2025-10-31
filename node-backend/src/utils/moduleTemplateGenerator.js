/**
 * 🚀 UNIVERSAL MODULE TEMPLATE GENERATOR
 * This system automatically generates module configurations for ANY order type
 * Reduces implementation time from 2-3 hours to 15 minutes per module
 */

const mongoose = require('mongoose');

class ModuleTemplateGenerator {
  constructor() {
    this.baseConfig = {
      // Common fields that all modules share
      commonFields: {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        order_number: { type: String, required: true, unique: true },
        status: { type: String, enum: ['pending', 'confirmed', 'processing', 'delivered', 'cancelled'], default: 'pending' },
        total_amount: { type: Number, required: true, min: 0 },
        payment_method: { type: String, enum: ['cod', 'razorpay', 'phonepay', 'paytm', 'amazonpay', 'credit_card', 'debit_card', 'upi', 'net_banking', 'cash'], default: 'cod' },
        payment_status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now }
      },
      
      // Address field templates
      addressTemplates: {
        simple: { type: String, trim: true },
        detailed: {
          address_line1: String,
          address_line2: String,
          city: String,
          state: String,
          country: { type: String, default: 'India' },
          pincode: String,
          phone: String,
          landmark: String
        }
      },
      
      // Status flow templates
      statusFlows: {
        basic: ['pending', 'confirmed', 'processing', 'delivered', 'cancelled'],
        delivery: ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled'],
        restaurant: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']
      },
      
      // Rider integration templates
      riderIntegration: {
        orderAssignment: {
          order_id: { type: mongoose.Schema.Types.ObjectId, required: true },
          order_type: { type: String, required: true },
          rider_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider', required: false },
          status: { type: String, enum: ['assigned', 'accepted', 'rejected', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled'], default: 'assigned' },
          assigned_at: { type: Date, default: Date.now },
          accepted_at: Date,
          picked_up_at: Date,
          delivered_at: Date,
          completed_at: Date,
          cancelled_at: Date,
          earnings: { type: Number, default: 0 },
          distance: { type: Number, default: 0 },
          duration: { type: Number, default: 0 },
          cancellation_reason: String,
          rating: { type: Number, min: 1, max: 5 },
          review: String,
          payment_status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
          is_active: { type: Boolean, default: true }
        }
      }
    };
  }

  /**
   * Generate complete module configuration for any order type
   * @param {Object} config - Module configuration
   * @returns {Object} Complete module setup
   */
  generateModuleConfig(config) {
    const {
      moduleName,
      modelName,
      addressType = 'detailed',
      statusFlow = 'delivery',
      customFields = {},
      virtuals = [],
      indexes = [],
      orderAssignment = true
    } = config;

    // Generate schema
    const schema = this.generateSchema(config);
    
    // Generate model
    const model = this.generateModel(modelName, schema);
    
    // Generate controller
    const controller = this.generateController(config);
    
    // Generate routes
    const routes = this.generateRoutes(config);
    
    // Generate rider integration
    const riderIntegration = orderAssignment ? this.generateRiderIntegration(config) : null;

    return {
      schema,
      model,
      controller,
      routes,
      riderIntegration,
      config: {
        moduleName,
        modelName,
        addressType,
        statusFlow,
        customFields,
        virtuals,
        indexes,
        orderAssignment
      }
    };
  }

  /**
   * Generate Mongoose schema for the module
   */
  generateSchema(config) {
    const { addressType, statusFlow, customFields } = config;
    
    const schemaFields = {
      ...this.baseConfig.commonFields,
      ...this.baseConfig.addressTemplates[addressType],
      ...customFields
    };

    // Add status enum based on flow
    if (statusFlow && this.baseConfig.statusFlows[statusFlow]) {
      schemaFields.status.enum = this.baseConfig.statusFlows[statusFlow];
    }

    return new mongoose.Schema(schemaFields, {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true }
    });
  }

  /**
   * Generate Mongoose model
   */
  generateModel(modelName, schema) {
    return mongoose.models[modelName] || mongoose.model(modelName, schema);
  }

  /**
   * Generate controller with standard CRUD operations
   */
  generateController(config) {
    const { moduleName, modelName } = config;
    
    return {
      // Create order
      [`create${modelName}`]: async (req, res) => {
        try {
          const userId = req.user.id;
          const orderData = { ...req.body, user_id: userId };
          
          const order = new mongoose.models[modelName](orderData);
          await order.save();

          // Auto-create OrderAssignment if enabled
          if (config.orderAssignment) {
            const OrderAssignment = require('../models/orderAssignment');
            const orderAssignment = new OrderAssignment({
              order_id: order._id,
              order_type: moduleName,
              rider_id: null,
              status: 'assigned',
              assigned_at: new Date()
            });
            await orderAssignment.save();
          }

          res.status(201).json({
            success: true,
            message: `${modelName} created successfully`,
            data: order
          });
        } catch (error) {
          console.error(`Error creating ${modelName}:`, error);
          res.status(500).json({
            success: false,
            message: `Error creating ${modelName}`,
            error: error.message
          });
        }
      },

      // Get user orders
      [`getUser${modelName}s`]: async (req, res) => {
        try {
          const userId = req.user.id;
          const orders = await mongoose.models[modelName].find({ user_id: userId })
            .sort({ createdAt: -1 });

          res.json({
            success: true,
            data: orders
          });
        } catch (error) {
          console.error(`Error fetching ${modelName}s:`, error);
          res.status(500).json({
            success: false,
            message: `Error fetching ${modelName}s`,
            error: error.message
          });
        }
      },

      // Get order by ID
      [`get${modelName}ById`]: async (req, res) => {
        try {
          const userId = req.user.id;
          const order = await mongoose.models[modelName].findOne({ 
            _id: req.params.id, 
            user_id: userId 
          });

          if (!order) {
            return res.status(404).json({
              success: false,
              message: `${modelName} not found`
            });
          }

          res.json({
            success: true,
            data: order
          });
        } catch (error) {
          console.error(`Error fetching ${modelName}:`, error);
          res.status(500).json({
            success: false,
            message: `Error fetching ${modelName}`,
            error: error.message
          });
        }
      },

      // Update order status
      [`update${modelName}Status`]: async (req, res) => {
        try {
          const { status } = req.body;
          const userId = req.user.id;
          
          const order = await mongoose.models[modelName].findOneAndUpdate(
            { _id: req.params.id, user_id: userId },
            { status, updated_at: new Date() },
            { new: true, runValidators: true }
          );

          if (!order) {
            return res.status(404).json({
              success: false,
              message: `${modelName} not found`
            });
          }

          res.json({
            success: true,
            message: `${modelName} status updated successfully`,
            data: order
          });
        } catch (error) {
          console.error(`Error updating ${modelName} status:`, error);
          res.status(500).json({
            success: false,
            message: `Error updating ${modelName} status`,
            error: error.message
          });
        }
      },

      // Cancel order
      [`cancel${modelName}`]: async (req, res) => {
        try {
          const userId = req.user.id;
          const order = await mongoose.models[modelName].findOne({ 
            _id: req.params.id, 
            user_id: userId 
          });

          if (!order) {
            return res.status(404).json({
              success: false,
              message: `${modelName} not found`
            });
          }

          if (order.status === 'cancelled') {
            return res.status(400).json({
              success: false,
              message: 'Order is already cancelled'
            });
          }

          if (['delivered', 'shipped'].includes(order.status)) {
            return res.status(400).json({
              success: false,
              message: 'Cannot cancel order that has been shipped or delivered'
            });
          }

          order.status = 'cancelled';
          order.updated_at = new Date();
          await order.save();

          res.json({
            success: true,
            message: `${modelName} cancelled successfully`,
            data: order
          });
        } catch (error) {
          console.error(`Error cancelling ${modelName}:`, error);
          res.status(500).json({
            success: false,
            message: `Error cancelling ${modelName}`,
            error: error.message
          });
        }
      }
    };
  }

  /**
   * Generate Express routes
   */
  generateRoutes(config) {
    const { moduleName, modelName } = config;
    const routeName = moduleName.toLowerCase();
    
    return {
      [`/${routeName}`]: {
        'POST': `create${modelName}`,
        'GET': `getUser${modelName}s`
      },
      [`/${routeName}/:id`]: {
        'GET': `get${modelName}ById`,
        'PUT': `update${modelName}Status`,
        'DELETE': `cancel${modelName}`
      }
    };
  }

  /**
   * Generate rider integration configuration
   */
  generateRiderIntegration(config) {
    const { moduleName } = config;
    
    return {
      // Module registry entry for rider controller
      moduleRegistry: {
        [moduleName]: {
          model: `mongoose.models['${config.modelName}']`,
          statusFilter: 'confirmed',
          paymentStatusFilter: 'paid',
          populateFields: ['user', 'name phone'],
          pickupField: null, // Use warehouse
          dropoffField: 'address',
          fareField: 'total_amount',
          distanceField: null,
          vehicleTypeField: null,
          customerNameField: 'user.name',
          customerPhoneField: 'user.phone',
          itemDescriptionField: null,
          specialInstructionsField: null,
          defaultVehicleType: 'Bike',
          defaultItemDescription: `${moduleName} order`,
          useWarehouse: true,
          complexPaymentFilter: {
            $or: [
              { payment_status: 'paid' },
              { payment_method: 'cod', payment_status: 'pending' }
            ]
          }
        }
      },
      
      // Order assignment creation
      createOrderAssignment: async (orderId) => {
        const OrderAssignment = require('../models/orderAssignment');
        return new OrderAssignment({
          order_id: orderId,
          order_type: moduleName,
          rider_id: null,
          status: 'assigned',
          assigned_at: new Date()
        });
      }
    };
  }

  /**
   * Quick setup for common module types
   */
  getPresetConfigs() {
    return {
      // Food delivery module
      food: {
        moduleName: 'food',
        modelName: 'FoodOrder',
        addressType: 'detailed',
        statusFlow: 'restaurant',
        customFields: {
          restaurant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
          subtotal: { type: Number, required: true, min: 0 },
          tax_amount: { type: Number, default: 0 },
          delivery_fee: { type: Number, default: 0 },
          discount_amount: { type: Number, default: 0 },
          packaging_fee: { type: Number, default: 0 },
          delivery_method: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
          estimated_delivery_time: Date,
          actual_delivery_time: Date,
          delivery_instructions: String,
          special_instructions: String,
          tracking_info: {
            order_confirmed_at: Date,
            preparation_started_at: Date,
            order_ready_at: Date,
            pickup_at: Date,
            delivered_at: Date
          },
          delivery_partner: {
            name: String,
            phone: String,
            vehicle_number: String
          },
          rating: { type: Number, min: 1, max: 5 },
          review: String,
          cancellation_reason: String,
          cancelled_by: { type: String, enum: ['customer', 'restaurant', 'admin', 'system'] },
          refund_amount: { type: Number, default: 0 },
          notes: String
        }
      },

      // Ecommerce module
      ecommerce: {
        moduleName: 'ecommerce',
        modelName: 'Order',
        addressType: 'detailed',
        statusFlow: 'delivery',
        customFields: {
          subtotal: { type: Number, required: true, min: 0 },
          tax_amount: { type: Number, default: 0 },
          shipping_amount: { type: Number, default: 0 },
          discount_amount: { type: Number, default: 0 },
          billing_address: {
            address_line1: String,
            address_line2: String,
            city: String,
            state: String,
            country: String,
            pincode: String,
            phone: String
          },
          shipping_method: { type: String, default: 'standard' },
          tracking_number: String,
          notes: String
        }
      },

      // Grocery module (enhanced)
      grocery: {
        moduleName: 'grocery',
        modelName: 'GroceryOrder',
        addressType: 'detailed',
        statusFlow: 'delivery',
        customFields: {
          delivery_instructions: String,
          preferred_delivery_time: Date,
          packaging_preferences: String,
          special_requests: String,
          tracking_info: {
            order_confirmed_at: Date,
            processing_started_at: Date,
            ready_for_pickup_at: Date,
            picked_up_at: Date,
            delivered_at: Date
          }
        }
      }
    };
  }
}

module.exports = ModuleTemplateGenerator;
