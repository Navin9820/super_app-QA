// 🍕 FRONTEND STATUS POLLING SOLUTION FOR FOOD ORDERS
// Add this to your Super App frontend to get real-time status updates

class FoodOrderStatusTracker {
  constructor() {
    this.activeOrders = new Map(); // Track active orders
    this.pollInterval = null;
    this.isPolling = false;
  }

  // Start tracking an order
  startTracking(orderId, orderType = 'food') {
    console.log(`🔄 Starting to track order: ${orderId}`);
    
    this.activeOrders.set(orderId, {
      orderId,
      orderType,
      lastStatus: null,
      lastChecked: new Date()
    });

    // Start polling if not already running
    if (!this.isPolling) {
      this.startPolling();
    }
  }

  // Stop tracking an order
  stopTracking(orderId) {
    console.log(`⏹️ Stopping tracking for order: ${orderId}`);
    this.activeOrders.delete(orderId);
    
    // Stop polling if no more orders to track
    if (this.activeOrders.size === 0) {
      this.stopPolling();
    }
  }

  // Start polling for status updates
  startPolling() {
    if (this.isPolling) return;
    
    this.isPolling = true;
    this.pollInterval = setInterval(() => {
      this.checkAllOrders();
    }, 3000); // Poll every 3 seconds
    
    console.log('🔄 Started status polling');
  }

  // Stop polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
    console.log('⏹️ Stopped status polling');
  }

  // Check all active orders
  async checkAllOrders() {
    for (const [orderId, orderData] of this.activeOrders) {
      try {
        await this.checkOrderStatus(orderId, orderData);
      } catch (error) {
        console.error(`❌ Error checking order ${orderId}:`, error);
      }
    }
  }

  // Check status of a specific order
  async checkOrderStatus(orderId, orderData) {
    try {
      const response = await fetch(
        `http://localhost:5000/api/riders/orders/${orderId}/status?order_type=${orderData.orderType}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const currentStatus = data.data.order_status;
        
        // Check if status has changed
        if (currentStatus !== orderData.lastStatus) {
          console.log(`📊 Order ${orderId} status changed: ${orderData.lastStatus} → ${currentStatus}`);
          
          // Update the order data
          orderData.lastStatus = currentStatus;
          orderData.lastChecked = new Date();
          
          // Update the UI
          this.updateOrderUI(orderId, currentStatus, data.data);
          
          // Stop tracking if order is completed
          if (this.isOrderCompleted(currentStatus)) {
            this.stopTracking(orderId);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error fetching status for order ${orderId}:`, error);
    }
  }

  // Update the UI with new status
  updateOrderUI(orderId, status, orderData) {
    // Find the order element in your DOM
    const orderElement = document.querySelector(`[data-order-id="${orderId}"]`);
    
    if (orderElement) {
      // Update status display
      const statusElement = orderElement.querySelector('.order-status');
      if (statusElement) {
        statusElement.textContent = this.getStatusDisplay(status);
        statusElement.className = `order-status status-${status}`;
      }

      // Update order details if needed
      const orderDetails = orderElement.querySelector('.order-details');
      if (orderDetails) {
        orderDetails.innerHTML = this.getOrderDetailsHTML(orderData);
      }

      // Show notification if status changed
      this.showStatusNotification(orderId, status);
    }
  }

  // Get display text for status
  getStatusDisplay(status) {
    const statusMap = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'ready': 'Ready for Pickup',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    
    return statusMap[status] || status;
  }

  // Get HTML for order details
  getOrderDetailsHTML(orderData) {
    return `
      <div class="order-info">
        <p><strong>Order ID:</strong> ${orderData.order_id}</p>
        <p><strong>Status:</strong> ${this.getStatusDisplay(orderData.order_status)}</p>
        <p><strong>Last Updated:</strong> ${new Date().toLocaleString()}</p>
      </div>
    `;
  }

  // Check if order is completed
  isOrderCompleted(status) {
    return ['delivered', 'cancelled', 'completed'].includes(status);
  }

  // Show status notification
  showStatusNotification(orderId, status) {
    // You can customize this notification
    const notification = document.createElement('div');
    notification.className = 'status-notification';
    notification.innerHTML = `
      <p>Order ${orderId} status updated to: ${this.getStatusDisplay(status)}</p>
    `;
    
    // Add to your notification container
    const container = document.querySelector('.notifications') || document.body;
    container.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Get auth token (implement based on your auth system)
  getAuthToken() {
    return localStorage.getItem('authToken') || 'your-auth-token';
  }
}

// 🚀 USAGE IN YOUR SUPER APP

// Initialize the tracker
const orderTracker = new FoodOrderStatusTracker();

// When user views orders page
function onOrdersPageLoad() {
  // Get all active orders from your orders list
  const activeOrders = document.querySelectorAll('[data-order-id]');
  
  activeOrders.forEach(orderElement => {
    const orderId = orderElement.getAttribute('data-order-id');
    const orderType = orderElement.getAttribute('data-order-type') || 'food';
    
    // Start tracking each order
    orderTracker.startTracking(orderId, orderType);
  });
}

// When user navigates away from orders page
function onOrdersPageUnload() {
  // Stop tracking all orders
  orderTracker.stopPolling();
}

// When a new order is created
function onNewOrderCreated(orderId, orderType = 'food') {
  orderTracker.startTracking(orderId, orderType);
}

// When an order is completed
function onOrderCompleted(orderId) {
  orderTracker.stopTracking(orderId);
}

// 🎨 CSS FOR STATUS STYLING
const statusStyles = `
.status-pending { color: #f59e0b; background: #fef3c7; }
.status-confirmed { color: #059669; background: #d1fae5; }
.status-preparing { color: #7c3aed; background: #ede9fe; }
.status-ready { color: #dc2626; background: #fee2e2; }
.status-out_for_delivery { color: #2563eb; background: #dbeafe; }
.status-delivered { color: #059669; background: #d1fae5; }
.status-cancelled { color: #dc2626; background: #fee2e2; }

.status-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #059669;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}
`;

// Add styles to your page
const styleSheet = document.createElement('style');
styleSheet.textContent = statusStyles;
document.head.appendChild(styleSheet);

// Export for use in your app
window.FoodOrderStatusTracker = FoodOrderStatusTracker;
window.orderTracker = orderTracker;

console.log('🍕 Food Order Status Tracker loaded!');
