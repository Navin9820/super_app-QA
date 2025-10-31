// Delivery Management Service
import { API_CONFIG } from '../config/api.js';
import { SUPER_APP_API_CONFIG } from '../config/superAppApi.js';

class DeliveryService {
  constructor() {
    // Load deliveries from localStorage if available
    const storedDeliveries = localStorage.getItem('deliveries');
    if (storedDeliveries) {
      this.deliveries = JSON.parse(storedDeliveries);
    } else {
      this.deliveries = [];
      this._saveDeliveries();
    }
    this.activeDelivery = null;
    this.deliveryRequests = [];
  }

  // Fetch route with graceful fallbacks - FREE backend proxy preferred
  async getRoute(from, to) {
    try {
      if (!Array.isArray(from) || !Array.isArray(to)) {
        return { success: false, message: 'Invalid coordinates' };
      }
      const [fromLat, fromLng] = from;
      const [toLat, toLng] = to;

      // Try backend proxy first for proper turn-by-turn directions
      try {
        const proxyUrl = `${SUPER_APP_API_CONFIG.BASE_URL}/maps/directions?from=${fromLat},${fromLng}&to=${toLat},${toLng}&mode=driving`;
        
        const response = await fetch(proxyUrl);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data?.success && data?.data) {
            return {
              success: true,
              coords: data.data.coordinates,
              distance: data.data.distance,
              duration: data.data.duration,
              steps: data.data.steps,
              provider: data.data.provider,
              polyline: data.data.polyline
            };
          }
        }
      } catch (proxyError) {
        // Backend proxy failed, will use fallback
      }

      // Fallback to straight-line route if backend fails
      
      // Calculate approximate distance using Haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = (toLat - fromLat) * Math.PI / 180;
      const dLng = (toLng - fromLng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      // Rough time estimate (assuming 25 km/h average city speed)
      const duration = Math.round((distance / 25) * 60);

      return { 
        success: true, 
        coords: [from, to], 
        distance: `${distance.toFixed(2)} km`, 
        duration: `${duration} min`, 
        steps: [],
        provider: 'straight-line-fallback'
      };
    } catch (err) {
      // Final fallback to straight line
      return { 
        success: false, 
        coords: [from, to], 
        distance: 'N/A', 
        duration: 'N/A', 
        steps: [], 
        message: err.message 
      };
    }
  }

  _saveDeliveries() {
    localStorage.setItem('deliveries', JSON.stringify(this.deliveries));
  }

  // Get all deliveries with filtering
  getDeliveries(status = 'all') {
    this.reloadFromStorage();
    if (status === 'all') {
      return this.deliveries;
    }
    return this.deliveries.filter(delivery => delivery.status === status);
  }

  // Get delivery by ID
  getDeliveryById(id) {
    return this.deliveries.find(delivery => delivery.id === id);
  }

  // Create new delivery
  createDelivery(deliveryData) {
    // Safeguard: ensure pickup is always set
    const safePickup = deliveryData.pickup || 'Chennai Central';
    const newDelivery = {
      id: `DEL${Date.now()}`,
      ...deliveryData,
      pickup: safePickup,
      status: 'pending', // Start as pending, not active
      startTime: new Date().toISOString(),
      rating: null,
      paymentMethod: null,
      cancelReason: null,
      endTime: null,
      actualDistance: null,
      actualDuration: null
    };
    
    // Only set as active if explicitly requested
    if (deliveryData.status === 'active') {
      newDelivery.status = 'active';
      this.activeDelivery = newDelivery;
    }
    
    this.deliveries.unshift(newDelivery);
    this._saveDeliveries();
    this._notifyDataChanged();
    return newDelivery;
  }

  // Update delivery status with comprehensive state management
  updateDeliveryStatus(deliveryId, status, additionalData = {}) {
    const deliveryIndex = this.deliveries.findIndex(delivery => delivery.id === deliveryId);
    if (deliveryIndex !== -1) {
      const currentDelivery = this.deliveries[deliveryIndex];
      
      // Prepare update data
      const updateData = {
        status,
        ...additionalData
      };

      // Handle specific status transitions
      switch (status) {
        case 'active':
          // Clear any existing active delivery
          this.deliveries.forEach(d => {
            if (d.status === 'active' && d.id !== deliveryId) {
              d.status = 'pending';
            }
          });
          this.activeDelivery = { ...currentDelivery, ...updateData };
          break;
          
        case 'completed':
          // Ensure endTime is set
          if (!updateData.endTime) {
            updateData.endTime = new Date().toISOString();
          }
          // Add completion timestamp
          updateData.completedAt = new Date().toISOString();
          this.activeDelivery = null;
          break;
          
        case 'cancelled':
          // Ensure cancelReason is set
          if (!updateData.cancelReason) {
            updateData.cancelReason = 'Cancelled by delivery partner';
          }
          // Add cancellation timestamp
          updateData.cancelledAt = new Date().toISOString();
          this.activeDelivery = null;
          break;
          
        case 'pending':
          // If this was the active delivery, clear it
          if (this.activeDelivery && this.activeDelivery.id === deliveryId) {
            this.activeDelivery = null;
          }
          break;
          
        default:
          // Handle any other status
          break;
      }

      // Update the delivery
      this.deliveries[deliveryIndex] = {
        ...currentDelivery,
        ...updateData
      };
      
      // If delivery is completed, add earnings to delivery wallet
      if (status === 'completed') {
        const delivery = this.deliveries[deliveryIndex];
        if (delivery.fare || delivery.payment) {
          const earnings = delivery.fare || delivery.payment || 0;
          // Import delivery wallet service dynamically to avoid circular dependencies
          import('./deliveryWallet.jsx').then(module => {
            const deliveryWalletService = module.default;
            deliveryWalletService.addDeliveryEarnings(delivery.id, earnings);
          }).catch(error => {
            console.error('Failed to add delivery earnings:', error);
          });
        }
      }
      
      this._saveDeliveries();
      this._notifyDataChanged();
      return this.deliveries[deliveryIndex];
    }
    return null;
  }

  // Start a delivery (transition from pending to active)
  startDelivery(deliveryId) {
    const result = this.updateDeliveryStatus(deliveryId, 'active', {
      startedAt: new Date().toISOString()
    });
    return result;
  }

  // Complete a delivery
  completeDelivery(deliveryId, completionData = {}) {
    const result = this.updateDeliveryStatus(deliveryId, 'completed', {
      endTime: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      ...completionData
    });
    return result;
  }

  // Cancel a delivery
  cancelDelivery(deliveryId, cancelReason = 'Cancelled by delivery partner') {
    const result = this.updateDeliveryStatus(deliveryId, 'cancelled', {
      cancelReason,
      cancelledAt: new Date().toISOString()
    });
    return result;
  }

  // Delete a delivery by ID
  deleteDelivery(deliveryId) {
    const index = this.deliveries.findIndex(d => d.id === deliveryId);
    if (index !== -1) {
      this.deliveries.splice(index, 1);
      this._saveDeliveries();
      this._notifyDataChanged();
      return true;
    }
    return false;
  }

  // Get active delivery
  getActiveDelivery() {
    return this.activeDelivery;
  }

  // Add delivery request
  addDeliveryRequest(request) {
    const newRequest = {
      id: `DELREQ${Date.now()}`,
      ...request,
      timestamp: new Date().toISOString()
    };
    this.deliveryRequests.push(newRequest);
    return newRequest;
  }

  // Get pending delivery requests
  getDeliveryRequests() {
    return this.deliveryRequests;
  }

  // Accept delivery request
  acceptDeliveryRequest(requestId) {
    const requestIndex = this.deliveryRequests.findIndex(req => req.id === requestId);
    if (requestIndex !== -1) {
      const request = this.deliveryRequests[requestIndex];
      this.deliveryRequests.splice(requestIndex, 1);
      
      // Create new delivery from request
      const newDelivery = this.createDelivery({
        customerName: request.customerName || 'Customer',
        customerPhone: request.customerPhone || '+91 00000 00000',
        pickup: request.pickup,
        dropoff: request.dropoff,
        distance: request.distance,
        fare: request.fare,
        estimatedTime: request.time,
        itemDescription: request.itemDescription || 'Package'
      });
      
      return newDelivery;
    }
    return null;
  }

  // Reject delivery request
  rejectDeliveryRequest(requestId) {
    const requestIndex = this.deliveryRequests.findIndex(req => req.id === requestId);
    if (requestIndex !== -1) {
      this.deliveryRequests.splice(requestIndex, 1);
      return true;
    }
    return false;
  }

  // Get delivery statistics with enhanced metrics
  getDeliveryStats() {
    const completed = this.deliveries.filter(delivery => delivery.status === 'completed').length;
    const cancelled = this.deliveries.filter(delivery => delivery.status === 'cancelled').length;
    const active = this.deliveries.filter(delivery => delivery.status === 'active').length;
    const pending = this.deliveries.filter(delivery => delivery.status === 'pending').length;
    const total = this.deliveries.length;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
    
    // Calculate total earnings
    const totalEarnings = this.deliveries
      .filter(d => d.status === 'completed')
      .reduce((sum, d) => sum + (d.fare || d.payment || 0), 0);
    
    // Calculate average delivery time
    const completedDeliveries = this.deliveries.filter(d => d.status === 'completed' && d.startTime && d.endTime);
    const avgDeliveryTime = completedDeliveries.length > 0 
      ? completedDeliveries.reduce((sum, d) => {
          const start = new Date(d.startTime);
          const end = new Date(d.endTime);
          return sum + (end - start);
        }, 0) / completedDeliveries.length
      : 0;
    
    return {
      total,
      active,
      completed,
      cancelled,
      pending,
      completionRate: parseFloat(completionRate),
      totalEarnings,
      avgDeliveryTime: Math.round(avgDeliveryTime / 60000), // Convert to minutes
      averageRating: this.getAverageRating()
    };
  }

  // Get average rating
  getAverageRating() {
    const ratedDeliveries = this.deliveries.filter(delivery => delivery.rating !== null);
    if (ratedDeliveries.length === 0) return 0;
    
    const totalRating = ratedDeliveries.reduce((sum, delivery) => sum + delivery.rating, 0);
    return (totalRating / ratedDeliveries.length).toFixed(1);
  }

  // Clear delivery requests (for demo purposes)
  clearDeliveryRequests() {
    this.deliveryRequests = [];
  }

  // Clear active delivery
  clearActiveDelivery() {
    this.activeDelivery = null;
  }

  // Force reload from localStorage
  reloadFromStorage() {
    const storedDeliveries = localStorage.getItem('deliveries');
    if (storedDeliveries) {
      this.deliveries = JSON.parse(storedDeliveries);
    } else {
      this.deliveries = [];
    }
    return this.deliveries;
  }

  // Clear all deliveries (for demo purposes)
  clearDeliveries() {
    this.deliveries = [];
    this.activeDelivery = null;
    this.deliveryRequests = [];
    this._saveDeliveries();
  }

  // Reset to initial state (for testing)
  resetToInitialState() {
    localStorage.removeItem('deliveries');
    this.deliveries = [];
    this.activeDelivery = null;
    this.deliveryRequests = [];
    this._saveDeliveries();
  }

  // Notify data changes
  _notifyDataChanged() {
    window.dispatchEvent(new Event('deliveriesDataChanged'));
  }

  // Add sample data for testing with proper status flow
  addSampleData() {
    const sampleDeliveries = [
      {
        id: 'DEL' + Date.now(),
        customerName: 'Ramesh',
        customerPhone: '+91 98765 43210',
        pickup: 'Pizza Hut, T Nagar',
        dropoff: 'Ramesh, Anna Nagar',
        distance: '3.2 km',
        fare: 45,
        estimatedTime: '15 mins',
        itemDescription: 'Food Delivery',
        status: 'active',
        startTime: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        rating: null,
        paymentMethod: null,
        cancelReason: null,
        endTime: null,
        actualDistance: null,
        actualDuration: null
      },
      {
        id: 'DEL' + (Date.now() + 1),
        customerName: 'Priya',
        customerPhone: '+91 98765 43211',
        pickup: 'Big Bazaar, Velachery',
        dropoff: 'Priya, Adyar',
        distance: '4.1 km',
        fare: 60,
        estimatedTime: '20 mins',
        itemDescription: 'Grocery',
        status: 'completed',
        startTime: new Date(Date.now() - 3600000).toISOString(),
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() - 1800000).toISOString(),
        completedAt: new Date(Date.now() - 1800000).toISOString(),
        rating: 5,
        paymentMethod: 'cash',
        cancelReason: null,
        actualDistance: '4.2 km',
        actualDuration: '18 mins'
      },
      {
        id: 'DEL' + (Date.now() + 2),
        customerName: 'Arun',
        customerPhone: '+91 98765 43212',
        pickup: 'DTDC, Nungambakkam',
        dropoff: 'Arun, Anna Nagar',
        distance: '2.8 km',
        fare: 35,
        estimatedTime: '12 mins',
        itemDescription: 'Parcel',
        status: 'cancelled',
        startTime: new Date(Date.now() - 7200000).toISOString(),
        startedAt: new Date(Date.now() - 7200000).toISOString(),
        cancelledAt: new Date(Date.now() - 6000000).toISOString(),
        rating: null,
        paymentMethod: null,
        cancelReason: 'Customer unavailable',
        endTime: null,
        actualDistance: null,
        actualDuration: null
      },
      {
        id: 'DEL' + (Date.now() + 3),
        customerName: 'Sita',
        customerPhone: '+91 98765 43213',
        pickup: 'KFC, T Nagar',
        dropoff: 'Sita, Mylapore',
        distance: '2.5 km',
        fare: 40,
        estimatedTime: '10 mins',
        itemDescription: 'Food Delivery',
        status: 'pending',
        startTime: new Date().toISOString(),
        rating: null,
        paymentMethod: null,
        cancelReason: null,
        endTime: null,
        actualDistance: null,
        actualDuration: null
      }
    ];
    
    this.deliveries = sampleDeliveries;
    this._saveDeliveries();
    this._notifyDataChanged();
    return sampleDeliveries;
  }
}

const deliveryService = new DeliveryService();

export default deliveryService; 