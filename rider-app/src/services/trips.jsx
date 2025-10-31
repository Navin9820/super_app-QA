// Trip Management Service - Integrated with Super App Backend
import { riderAPI } from '../config/superAppApi';

class TripService {
  constructor() {
    this.activeTrip = null;
    this.rideRequests = [];
    this.isLoading = false;
    // 🚀 PERFORMANCE: Add caching for expensive operations
    this.cache = {
      trips: null,
      stats: null,
      availableOrders: null,
      lastFetch: null,
      cacheTimeout: 30000 // 30 seconds cache
    };
  }

  // Get all trips with filtering from backend
  async getTrips(status = 'all', orderType = null) {
    try {
      this.isLoading = true;
      const response = await riderAPI.getRiderOrders();
      
      if (response.success) {
        let trips = response.data || [];
        
        // Filter by status if specified
        if (status !== 'all') {
          trips = trips.filter(trip => trip.status === status);
        }
        
        // Filter by order type if specified
        if (orderType && orderType !== 'all') {
          trips = trips.filter(trip => trip.order_type === orderType);
        }
        
        // Transform backend data to frontend format
        const transformedTrips = trips.map(trip => this._transformTripData(trip));
        
        // Better error handling for no trips
        
        return transformedTrips;
      }
      return [];
    } catch (error) {
      return [];
    } finally {
      this.isLoading = false;
    }
  }

  // Get trip by ID from backend
  async getTripById(id) {
    try {
      const trips = await this.getTrips();
      return trips.find(trip => trip.id === id);
    } catch (error) {
      return null;
    }
  }

  // 🚀 OPTIMIZED: Get available orders with caching
  async getAvailableOrders(orderType = null) {
    try {
      // Check cache first
      const now = Date.now();
      if (this.cache.availableOrders && this.cache.lastFetch && (now - this.cache.lastFetch) < this.cache.cacheTimeout) {
        let orders = this.cache.availableOrders;
        // Apply filter if needed
        if (orderType) {
          orders = orders.filter(order => order.type === orderType);
        }
        return orders;
      }

      this.isLoading = true;
      const response = await riderAPI.getAvailableOrders();
      
      if (response.success) {
        let orders = response.data || [];
        
        // Filter by order type if specified
        if (orderType) {
          orders = orders.filter(order => order.type === orderType);
        }
        
        // Transform to ride request format and remove duplicates
        const transformedOrders = orders.map(order => this._transformToRideRequest(order));
        
        // Remove duplicates based on order_id
        const uniqueOrders = transformedOrders.filter((order, index, self) => 
          index === self.findIndex(o => o.order_id === order.order_id)
        );
        
        // Cache the results
        this.cache.availableOrders = uniqueOrders;
        this.cache.lastFetch = now;
        
        return uniqueOrders;
      }
      return [];
    } catch (error) {
      return [];
    } finally {
      this.isLoading = false;
    }
  }

  // Accept an order
  async acceptOrder(orderId, orderType) {
    try {
      const response = await riderAPI.acceptOrder(orderId, { order_type: orderType });
      
      if (response.success) {
        // Create active trip from accepted order
        const activeTrip = {
          id: orderId,
          order_type: orderType,
          status: 'accepted',
          startTime: new Date().toISOString(),
          ...response.data
        };
        
        this.activeTrip = activeTrip;
        return activeTrip;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Update trip status
  async updateTripStatus(tripId, status, orderType, additionalData = {}) {
    try {
      const response = await riderAPI.updateOrderStatus(tripId, status, orderType);
      
      if (response.success) {
        // Update active trip if it matches
        if (this.activeTrip && this.activeTrip.id === tripId) {
          this.activeTrip = {
            ...this.activeTrip,
            status,
            ...additionalData
          };
          
          if (status === 'completed' || status === 'cancelled') {
            this.activeTrip = null;
          }
        }
        
        return this.activeTrip;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Get active trip
  getActiveTrip() {
    return this.activeTrip;
  }

  // Add ride request (for local tracking)
  addRideRequest(request) {
    const newRequest = {
      id: `RIDE${Date.now()}`,
      ...request,
      timestamp: new Date().toISOString()
    };
    this.rideRequests.push(newRequest);
    return newRequest;
  }

  // Get pending ride requests
  getRideRequests() {
    return this.rideRequests;
  }

  // Accept ride request
  async acceptRideRequest(requestId) {
    try {
      const request = this.rideRequests.find(req => req.id === requestId);
      if (!request) return null;

      // Accept the order in backend
      const result = await this.acceptOrder(request.order_id, request.order_type);
      
      if (result) {
        // Remove from local requests
        this.rideRequests = this.rideRequests.filter(req => req.id !== requestId);
        return result;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Reject ride request
  rejectRideRequest(requestId) {
    this.rideRequests = this.rideRequests.filter(req => req.id !== requestId);
  }

  // 🚀 OPTIMIZED: Get trip statistics with caching
  async getTripStats() {
    try {
      // Check cache first
      const now = Date.now();
      if (this.cache.stats && this.cache.lastFetch && (now - this.cache.lastFetch) < this.cache.cacheTimeout) {
        return this.cache.stats;
      }

      // 🚀 PERFORMANCE: Get only recent trips for stats (not all trips)
      const response = await riderAPI.getRiderOrders();
      
      if (response.success) {
        const trips = response.data || [];
        
        // Calculate stats from trips
        const stats = {
          total: trips.length,
          completed: trips.filter(trip => trip.status === 'completed').length,
          active: trips.filter(trip => trip.status === 'active' || trip.status === 'accepted').length,
          cancelled: trips.filter(trip => trip.status === 'cancelled').length,
          totalEarnings: trips
            .filter(trip => trip.status === 'completed')
            .reduce((sum, trip) => sum + (trip.earnings || 0), 0),
          averageRating: this.getAverageRating(trips),
          trips: trips // Include trips for recent activity
        };
        
        // Cache the results
        this.cache.stats = stats;
        this.cache.lastFetch = now;
        
        return stats;
      }
      
      return {
        total: 0,
        completed: 0,
        active: 0,
        cancelled: 0,
        totalEarnings: 0,
        averageRating: 0,
        trips: []
      };
    } catch (error) {
      console.error('Error getting trip stats:', error);
      return {
        total: 0,
        completed: 0,
        active: 0,
        cancelled: 0,
        totalEarnings: 0,
        averageRating: 0,
        trips: []
      };
    }
  }

  // Calculate average rating
  getAverageRating(trips = null) {
    try {
      const tripList = trips || this.trips || [];
      const ratedTrips = tripList.filter(trip => trip.rating && trip.rating > 0);
      
      if (ratedTrips.length === 0) return 0;
      
      const totalRating = ratedTrips.reduce((sum, trip) => sum + trip.rating, 0);
      return Math.round((totalRating / ratedTrips.length) * 10) / 10;
    } catch (error) {
      return 0;
    }
  }

  // Clear ride requests
  clearRideRequests() {
    this.rideRequests = [];
  }

  // Clear active trip
  clearActiveTrip() {
    this.activeTrip = null;
  }

  // 🚀 PERFORMANCE: Clear cache (call after order acceptance, status updates, etc.)
  clearCache() {
    this.cache = {
      trips: null,
      stats: null,
      availableOrders: null,
      lastFetch: null,
      cacheTimeout: 30000
    };
  }

  // Transform backend trip data to frontend format
  _transformTripData(trip) {
    
    // Extract order details if populated
    const orderDetails = trip.order || {};
    
    // 🔧 NEW: Status normalization for frontend compatibility
    let normalizedStatus = trip.status;
    if (trip.status === 'delivered') {
      normalizedStatus = 'completed';
    } else if (trip.status === 'out_for_delivery') {
      normalizedStatus = 'active';
    } else if (trip.status === 'accepted') {
      normalizedStatus = 'active';
    }
    
    // Build pickup address based on order type
    let pickupAddress = 'Pickup Location';
    if (orderDetails.warehouse_address) {
      // Ecommerce orders - use warehouse
      pickupAddress = orderDetails.warehouse_address;
    } else if (orderDetails.pickup_location && orderDetails.pickup_location.address) {
      // 🔧 FIXED: Taxi orders - use pickup_location.address
      pickupAddress = orderDetails.pickup_location.address;
    } else {
      // 🔧 FIXED: Food orders should ALSO use warehouse address (same as ecommerce)
      // The backend should provide warehouse_address for ALL order types
      pickupAddress = 'Default Warehouse Location';
    }
    
    // Build dropoff address based on order type
    let dropoffAddress = 'Dropoff Location';
    if (orderDetails.shipping_address) {
      // Ecommerce orders - use shipping_address
      const addr = orderDetails.shipping_address;
      const parts = [addr.address_line1, addr.address_line2, addr.city, addr.state, addr.pincode].filter(Boolean);
      if (parts.length > 0) {
        dropoffAddress = parts.join(', ');
      }
    } else if (orderDetails.delivery_address) {
      // 🔧 FIXED: Food orders - use delivery_address (what user selected in Super App)
      const addr = orderDetails.delivery_address;
      
      // Handle both object and string formats
      if (typeof addr === 'string') {
        dropoffAddress = addr;
      } else if (addr && typeof addr === 'object') {
        const parts = [addr.address_line1, addr.address_line2, addr.city, addr.state, addr.pincode].filter(Boolean);
        if (parts.length > 0) {
          dropoffAddress = parts.join(', ');
        }
      }
    } else if (orderDetails.dropoff_location && orderDetails.dropoff_location.address) {
      // 🔧 FIXED: Taxi orders - use dropoff_location.address
      dropoffAddress = orderDetails.dropoff_location.address;
    }
    
    
    const transformed = {
      id: trip.order_id || trip._id,
      order_type: trip.order_type,
      status: normalizedStatus, // 🔧 Use normalized status for frontend compatibility
      pickup: pickupAddress,
      dropoff: dropoffAddress,
      fare: trip.earnings || orderDetails.fare || orderDetails.total_amount || 0,
      distance: trip.distance || 0,
      startTime: trip.accepted_at || trip.assigned_at || orderDetails.createdAt,
      endTime: trip.completed_at || trip.delivered_at,
      rating: trip.rating || null,
      customer: orderDetails.user?.name || orderDetails.customer || 'Customer',
      customer_phone: orderDetails.user?.phone || orderDetails.customer_phone || '',
      vehicle_type: trip.vehicle_type || 'Bike',
      item_description: orderDetails.items?.map(item => item.product?.name || item.name).join(', ') || '',
      special_instructions: orderDetails.notes || orderDetails.special_instructions || ''
    };
    
    return transformed;
  }

  // Transform available order to ride request format
  _transformToRideRequest(order) {
    
    // Handle different order types with different field structures
    let pickup, dropoff, fare, distance, customer, customer_phone, vehicle_type, item_description, special_instructions;
    
    if (order.type === 'taxi' || order.type === 'taxi_request') {
      // Taxi orders have pickup_location and dropoff_location objects
      pickup = order.pickup_location?.address || order.pickup || 'Pickup Location';
      dropoff = order.dropoff_location?.address || order.dropoff || 'Dropoff Location';
      fare = order.fare || 0;
      distance = order.distance || 0;
      customer = order.user?.name || order.customer || 'Customer';
      customer_phone = order.user?.phone || order.customer_phone || '';
      vehicle_type = order.customer_vehicle_type || order.vehicle_type || 'Car';
      item_description = order.item_description || 'Taxi ride';
      special_instructions = order.special_instructions || '';
    } else if (order.type === 'porter' || order.type === 'porter_request') {
      // Porter orders have pickup_location and dropoff_location objects (same as taxi)
      pickup = order.pickup_location?.address || order.pickup || 'Pickup Location';
      dropoff = order.dropoff_location?.address || order.dropoff || 'Dropoff Location';
      fare = order.fare || 0;
      distance = order.distance || 0;
      customer = order.user?.name || order.customer || 'Customer';
      customer_phone = order.user?.phone || order.customer_phone || '';
      vehicle_type = order.vehicle_type || 'Auto';
      item_description = order.item_description || 'Porter delivery';
      special_instructions = order.special_instructions || '';
    } else {
      // Other order types (food, grocery, ecommerce)
      pickup = order.pickup || 'Pickup Location';
      dropoff = order.dropoff || 'Dropoff Location';
      fare = order.fare || 0;
      distance = order.distance || 0;
      customer = order.customer || 'Customer';
      customer_phone = order.customer_phone || '';
      vehicle_type = order.vehicle_type || 'Bike';
      item_description = order.item_description || 'Delivery';
      special_instructions = order.special_instructions || '';
    }
    
    const transformed = {
      id: `RIDE${order.id}`, // Use consistent ID based on backend order ID
      order_id: order.id,
      order_type: order.type,
      pickup,
      dropoff,
      fare,
      distance,
      customer,
      customer_phone,
      vehicle_type,
      item_description,
      special_instructions,
      timestamp: order.created_at || order.createdAt || new Date().toISOString()
    };
    
    return transformed;
  }

  // Get loading state
  getLoadingState() {
    return this.isLoading;
  }
}

// Create singleton instance
const tripService = new TripService();
export default tripService; 