const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Role = require('../models/role');
const Permission = require('../models/permission');

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Temporary demo token bypass for development
    if (token === 'demo-token') {
      // Debug: Log request method and type
      console.log('🔍 Demo token auth - Request method:', req.method);
      console.log('🔍 Demo token auth - Request URL:', req.url);
      
      // Skip header checking for OPTIONS requests (preflight)
      if (req.method === 'OPTIONS') {
        console.log('🔍 Demo token auth - Skipping OPTIONS preflight request');
        req.user = {
          id: '68678c6f2ccb87d7ca07fd6e',
          name: 'Demo User',
          email: 'demo@example.com',
          role: 'admin'
        };
        return next();
      }
      
      // Debug: Log all headers to see what's being received
      console.log('🔍 Demo token auth - All headers:', req.headers);
      console.log('🔍 Demo token auth - x-user-id header:', req.headers['x-user-id']);
      console.log('🔍 Demo token auth - X-User-Id header:', req.headers['X-User-Id']);
      
      // Get user ID from request headers (set by frontend)
      const userId = req.headers['x-user-id'] || req.headers['X-User-Id'];
      
      console.log('🔍 Demo token auth - User ID from header:', userId);
      
      // For demo purposes, use the provided user ID as the unique identifier
      // This ensures each user gets their own orders
      let finalUserId = '68678c6f2ccb87d7ca07fd6e'; // Default fallback
      
      if (userId && userId.startsWith('user_')) {
        // Extract email from the generated user ID
        const email = userId.replace('user_', '').replace('_', '@').replace('_', '.');
        // Generate a consistent ObjectId based on email hash
        const crypto = require('crypto');
        const hash = crypto.createHash('md5').update(email).digest('hex');
        finalUserId = hash.substring(0, 24); // Use first 24 chars as ObjectId
        console.log('🔍 Demo token auth - Generated user ID from email:', email, '->', finalUserId);
      } else if (userId) {
        // Use the provided user ID directly
        finalUserId = userId;
        console.log('🔍 Demo token auth - Using provided user ID:', finalUserId);
      } else {
        console.log('🔍 Demo token auth - Using default user ID:', finalUserId);
      }
      
      req.user = {
        id: finalUserId, // Dynamic user ID based on frontend user
        name: 'Demo User',
        email: 'demo@example.com',
        role: 'admin'
      };
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');

      // Get user from token
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized to access this route'
        });
      }

      // Attach user to request object with role details
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        role_id: user.role_id
      }; // ✅ Plain object with role_id for permission checking
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in authentication',
      error: error.message
    });
  }
};

// Case-insensitive role check (backward compatibility)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.map(r => r.toLowerCase()).includes(req.user.role.toLowerCase())) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    next();
  };
};

// Category-specific permission check
exports.checkPermission = (resource, action, category) => {
  return async (req, res, next) => {
    try {
      // Super admin bypass
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user has role_id (new permission system)
      if (req.user.role_id) {
        const role = await Role.findById(req.user.role_id)
          .populate('permissions', 'resource action category');
        
        if (role && role.permissions) {
          const hasPermission = role.permissions.some(permission => 
            permission.resource === resource &&
            permission.action === action &&
            (permission.category === category || permission.category === 'all')
          );
          
          if (hasPermission) {
            return next();
          }
        }
      }

      // Fallback to legacy role check
      const permissionString = `${resource}:${action}:${category}`;
      const legacyPermissions = {
        'admin': ['*:*:*'],
        'ecommerce_admin': ['products:*:electronics', 'products:*:clothing', 'orders:*:electronics', 'orders:*:clothing'],
        'grocery_admin': ['products:*:groceries', 'orders:*:groceries'],
        'restaurant_admin': ['products:*:restaurants', 'orders:*:restaurants'],
        'hotel_admin': ['products:*:hotels', 'orders:*:hotels'],
        'taxi_admin': ['products:*:taxi', 'orders:*:taxi']
      };

      const userPermissions = legacyPermissions[req.user.role] || [];
      const hasLegacyPermission = userPermissions.some(perm => {
        if (perm === '*:*:*') return true;
        const [permResource, permAction, permCategory] = perm.split(':');
        return (permResource === '*' || permResource === resource) &&
               (permAction === '*' || permAction === action) &&
               (permCategory === '*' || permCategory === category);
      });

      if (hasLegacyPermission) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${permissionString}`
      });
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions'
      });
    }
  };
};

// Check if user has any permission for a resource
exports.hasResourcePermission = (resource) => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'admin') {
        return next();
      }

      if (req.user.role_id) {
        const role = await Role.findById(req.user.role_id)
          .populate('permissions', 'resource');
        
        if (role && role.permissions) {
          const hasPermission = role.permissions.some(permission => 
            permission.resource === resource
          );
          
          if (hasPermission) {
            return next();
          }
        }
      }

      // Legacy role check
      const resourceRoles = {
        'products': ['admin', 'ecommerce_admin', 'grocery_admin', 'restaurant_admin', 'hotel_admin', 'taxi_admin'],
        'orders': ['admin', 'ecommerce_admin', 'grocery_admin', 'restaurant_admin', 'hotel_admin', 'taxi_admin'],
        'categories': ['admin', 'ecommerce_admin', 'grocery_admin', 'restaurant_admin', 'hotel_admin', 'taxi_admin'],
        'users': ['admin'],
        'roles': ['admin'],
        'permissions': ['admin']
      };

      if (resourceRoles[resource] && resourceRoles[resource].includes(req.user.role)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `Access denied. Required resource permission: ${resource}`
      });
    } catch (error) {
      console.error('Resource permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource permissions'
      });
    }
  };
}; 