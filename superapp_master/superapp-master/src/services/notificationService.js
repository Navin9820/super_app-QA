// Notification Service for managing dynamic notifications
class NotificationService {
  constructor() {
    this.notifications = this.loadNotifications();
    this.listeners = [];
    this.currentUser = this.getCurrentUserIdentifier();
    
    // Module-specific color mapping
    this.moduleColors = {
      'Food Delivery': {
        primary: '#FF6B35',      // Orange
        secondary: '#FFF3E0',    // Light orange
        icon: '🍕',
        gradient: 'from-orange-400 to-red-500'
      },
      'Ecommerce Store': {
        primary: '#8B5CF6',      // Purple
        secondary: '#F3E8FF',    // Light purple
        icon: '🛍️',
        gradient: 'from-purple-400 to-indigo-500'
      },
      'Grocery Store': {
        primary: '#10B981',      // Green
        secondary: '#D1FAE5',    // Light green
        icon: '🛒',
        gradient: 'from-green-400 to-emerald-500'
      },
      'Porter Service': {
        primary: '#F59E0B',      // Amber
        secondary: '#FEF3C7',    // Light amber
        icon: '🚚',
        gradient: 'from-amber-400 to-yellow-500'
      },
      'Taxi Service': {
        primary: '#3B82F6',      // Blue
        secondary: '#DBEAFE',    // Light blue
        icon: '🚕',
        gradient: 'from-blue-400 to-cyan-500'
      },
      'Taxi Service - Driver Accepted': {
        primary: '#059669',      // Emerald
        secondary: '#D1FAE5',    // Light emerald
        icon: '✅',
        gradient: 'from-emerald-400 to-green-500'
      },
      'Payment': {
        primary: '#DC2626',      // Red
        secondary: '#FEE2E2',    // Light red
        icon: '💳',
        gradient: 'from-red-400 to-pink-500'
      }
    };
  }

  // Get current user identifier
  getCurrentUserIdentifier() {
    // Try to get from auth service first
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.email && userData.phone) {
      return `${userData.email}-${userData.phone}`;
    }
    
    // Fallback to other auth keys
    const userEmail = localStorage.getItem('userEmail');
    const userPhone = localStorage.getItem('userPhone');
    if (userEmail && userPhone) {
      return `${userEmail}-${userPhone}`;
    }
    
    return null;
  }

  // Load notifications from localStorage
  loadNotifications() {
    try {
      const currentUser = this.getCurrentUserIdentifier();
      const storedUser = this.getStoredUserIdentifier();
      
      // Only clear notifications if it's a completely different user (different email)
      // Allow phone number changes for the same email address
      if (currentUser && storedUser && currentUser !== storedUser) {
        const currentEmail = currentUser.split('-')[0];
        const storedEmail = storedUser.split('-')[0];
        
        // Only clear if it's a different email address
        if (currentEmail !== storedEmail) {
          console.log('🔄 Different user detected for notifications (different email), clearing old data');
          this.clearAllNotifications();
          return [];
        } else {
          console.log('📱 Same user, different phone number - preserving notifications:', { currentUser, storedUser });
          // Same user with different phone number - preserve notifications
        }
      }
      
      const saved = localStorage.getItem('notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading notifications:', error);
      return [];
    }
  }

  // Get stored user identifier from notifications
  getStoredUserIdentifier() {
    try {
      const saved = localStorage.getItem('notifications_user');
      return saved;
    } catch (error) {
      return null;
    }
  }

  // Clear all notifications from localStorage
  clearAllNotifications() {
    localStorage.removeItem('notifications');
    localStorage.removeItem('notifications_user');
    this.notifications = [];
  }

  // Save notifications to localStorage
  saveNotifications() {
    try {
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
      // Store current user identifier with notifications
      const currentUser = this.getCurrentUserIdentifier();
      if (currentUser) {
        localStorage.setItem('notifications_user', currentUser);
      }
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  // Generate unique ID
  generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  }

  // Format time ago
  formatTimeAgo(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  // Get module colors
  getModuleColors(moduleName) {
    return this.moduleColors[moduleName] || {
      primary: '#6B7280',      // Gray fallback
      secondary: '#F3F4F6',    // Light gray
      icon: '🔔',
      gradient: 'from-gray-400 to-gray-500'
    };
  }

  // Add new notification
  addNotification(notification) {
    const newNotification = {
      id: this.generateId(),
      timestamp: new Date().getTime(),
      time: this.formatTimeAgo(new Date().getTime()),
      isRead: false,
      priority: 'medium',
      actionRequired: false,
      ...notification
    };

    this.notifications.unshift(newNotification);
    this.saveNotifications();
    this.notifyListeners();
    
    return newNotification;
  }

  // Add order success notification
  addOrderSuccessNotification(orderData) {
    const { orderId, totalAmount, restaurantName, estimatedDelivery } = orderData;
    const moduleColors = this.getModuleColors(restaurantName);
    
    return this.addNotification({
      title: 'Order Placed Successfully! 🎉',
      message: `Your order #${orderId} from ${restaurantName} has been confirmed. Total: ${totalAmount}`,
      type: 'order_success',
      priority: 'high',
      actionRequired: true,
      orderId: orderId,
      amount: totalAmount,
      restaurantName: restaurantName,
      estimatedDelivery: estimatedDelivery,
      module: restaurantName,
      colors: moduleColors
    });
  }

  // Add payment success notification
  addPaymentSuccessNotification(paymentData) {
    const { orderId, amount, paymentMethod } = paymentData;
    const moduleColors = this.getModuleColors('Payment');
    
    return this.addNotification({
      title: 'Payment Successful! 💳',
      message: `Payment of ${amount} for order #${orderId} has been processed via ${paymentMethod}`,
      type: 'payment_success',
      priority: 'high',
      actionRequired: false,
      orderId: orderId,
      amount: amount,
      paymentMethod: paymentMethod,
      module: 'Payment',
      colors: moduleColors
    });
  }

  // Add order status update
  addOrderStatusNotification(orderData) {
    const { orderId, status, message, estimatedTime } = orderData;
    
    const statusMessages = {
      'confirmed': 'Order Confirmed',
      'preparing': 'Order Being Prepared',
      'ready': 'Order Ready for Pickup',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Order Delivered',
      'cancelled': 'Order Cancelled'
    };

    return this.addNotification({
      title: statusMessages[status] || 'Order Update',
      message: message || `Your order #${orderId} status has been updated`,
      type: 'order_update',
      priority: 'medium',
      actionRequired: status === 'delivered',
      orderId: orderId,
      status: status,
      estimatedTime: estimatedTime
    });
  }

  // Mark notification as read
  markAsRead(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  // Mark all as read
  markAllAsRead() {
    this.notifications.forEach(notification => {
      notification.isRead = true;
    });
    this.saveNotifications();
    this.notifyListeners();
  }

  // Delete notification
  deleteNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
    this.notifyListeners();
  }

  // Get all notifications
  getNotifications() {
    return [...this.notifications];
  }

  // Get unread count
  getUnreadCount() {
    return this.notifications.filter(n => !n.isRead).length;
  }

  // Group notifications by time
  getGroupedNotifications() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const thisWeek = new Date(today.getTime() - 7 * 86400000);

    return {
      today: this.notifications.filter(n => new Date(n.timestamp) >= today),
      yesterday: this.notifications.filter(n => 
        new Date(n.timestamp) >= yesterday && new Date(n.timestamp) < today
      ),
      thisWeek: this.notifications.filter(n => 
        new Date(n.timestamp) >= thisWeek && new Date(n.timestamp) < yesterday
      ),
      older: this.notifications.filter(n => new Date(n.timestamp) < thisWeek)
    };
  }

  // Subscribe to changes
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify listeners
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners();
  }

  // Clear notifications for new user (called when user changes)
  clearForNewUser() {
    console.log('🧹 Clearing notifications for new user');
    this.clearAllNotifications();
    this.notifyListeners();
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
