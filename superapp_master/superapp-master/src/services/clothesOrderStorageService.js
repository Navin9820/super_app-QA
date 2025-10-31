// Clothes Order Storage Service
// Handles user-specific storage of clothes order data

class ClothesOrderStorageService {
    constructor() {
        this.USER_TRACKING_KEY = 'lastClothesUser';
        this.OLD_ORDERS_KEY = 'clothesOrders';
    }

    // Get current user identifier
    getCurrentUser() {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const userEmail = localStorage.getItem('userEmail') || userData.email || 'anonymous';
        return userEmail;
    }

    // Get user-specific storage key
    getUserOrdersKey() {
        const user = this.getCurrentUser();
        return `clothesOrders_${user}`;
    }

    // Check if user has changed since last access
    hasUserChanged() {
        const currentUser = this.getCurrentUser();
        const lastUser = localStorage.getItem(this.USER_TRACKING_KEY);
        
        if (currentUser !== lastUser) {
            localStorage.setItem(this.USER_TRACKING_KEY, currentUser);
            return true;
        }
        return false;
    }

    // Clear all clothes order data (both old and new format)
    clearAllOrders() {
        // Clear old format
        localStorage.removeItem(this.OLD_ORDERS_KEY);
        
        // Clear all user-specific keys
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('clothesOrders_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Clear any other potential order-related data
        localStorage.removeItem('clothesOrders');
        localStorage.removeItem('userOrders');
        localStorage.removeItem('myOrders');
        localStorage.removeItem('orders');
        
        console.log('ClothesOrderStorageService: Cleared all clothes order data');
    }

    // Get orders for current user
    getOrders() {
        // Check if user changed and clear data if needed
        if (this.hasUserChanged()) {
            this.clearAllOrders();
            return [];
        }

        const ordersKey = this.getUserOrdersKey();
        try {
            return JSON.parse(localStorage.getItem(ordersKey) || '[]');
        } catch (error) {
            console.error('Error parsing orders from localStorage:', error);
            return [];
        }
    }

    // Save orders for current user
    saveOrders(orders) {
        const ordersKey = this.getUserOrdersKey();
        try {
            localStorage.setItem(ordersKey, JSON.stringify(orders));
        } catch (error) {
            console.error('Error saving orders to localStorage:', error);
        }
    }

    // Add a new order
    addOrder(order) {
        const orders = this.getOrders();
        orders.unshift(order);
        // Keep only last 50 orders
        this.saveOrders(orders.slice(0, 50));
    }

    // Update an order at specific index
    updateOrder(index, updatedOrder) {
        const orders = this.getOrders();
        if (index >= 0 && index < orders.length) {
            orders[index] = updatedOrder;
            this.saveOrders(orders);
        }
    }

    // Clear user tracking on logout
    clearUserTracking() {
        localStorage.removeItem(this.USER_TRACKING_KEY);
    }

    // Debug function to log current state
    debug() {
        console.log('=== ClothesOrderStorageService Debug ===');
        console.log('Current user:', this.getCurrentUser());
        console.log('User orders key:', this.getUserOrdersKey());
        console.log('Last tracked user:', localStorage.getItem(this.USER_TRACKING_KEY));
        console.log('Current orders:', this.getOrders());
        console.log('All localStorage keys with "clothes":', 
            Object.keys(localStorage).filter(key => key.includes('clothes')));
        console.log('=====================================');
    }

    // Manual clear function for testing
    manualClear() {
        console.log('🧹 ClothesOrderStorageService: Manual clear initiated');
        this.clearAllOrders();
        this.clearUserTracking();
        console.log('🧹 ClothesOrderStorageService: Manual clear completed');
    }
}

// Export singleton instance
export const clothesOrderStorage = new ClothesOrderStorageService();
