// Taxi Ride Storage Service
// Handles user-specific storage of taxi ride data

class TaxiRideStorageService {
    constructor() {
        this.USER_TRACKING_KEY = 'lastTaxiUser';
        this.OLD_RIDES_KEY = 'taxiRides';
    }

    // Get current user identifier
    getCurrentUser() {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const userEmail = localStorage.getItem('userEmail') || userData.email || 'anonymous';
        return userEmail;
    }

    // Get user-specific storage key
    getUserRidesKey() {
        const user = this.getCurrentUser();
        return `taxiRides_${user}`;
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

    // Clear all taxi ride data (both old and new format)
    clearAllRides() {
        // Clear old format
        localStorage.removeItem(this.OLD_RIDES_KEY);
        
        // Clear all user-specific keys
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('taxiRides_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Clear any other potential ride-related data
        localStorage.removeItem('taxiRides');
        localStorage.removeItem('userRides');
        localStorage.removeItem('myRides');
        localStorage.removeItem('rides');
        
        console.log('TaxiRideStorageService: Cleared all taxi ride data');
    }

    // Get rides for current user
    getRides() {
        // Check if user changed and clear data if needed
        if (this.hasUserChanged()) {
            this.clearAllRides();
            return [];
        }

        const ridesKey = this.getUserRidesKey();
        try {
            return JSON.parse(localStorage.getItem(ridesKey) || '[]');
        } catch (error) {
            console.error('Error parsing rides from localStorage:', error);
            return [];
        }
    }

    // Save rides for current user
    saveRides(rides) {
        const ridesKey = this.getUserRidesKey();
        try {
            localStorage.setItem(ridesKey, JSON.stringify(rides));
        } catch (error) {
            console.error('Error saving rides to localStorage:', error);
        }
    }

    // Add a new ride
    addRide(ride) {
        const rides = this.getRides();
        rides.unshift(ride);
        // Keep only last 20 rides
        this.saveRides(rides.slice(0, 20));
    }

    // Update a ride at specific index
    updateRide(index, updatedRide) {
        const rides = this.getRides();
        if (index >= 0 && index < rides.length) {
            rides[index] = updatedRide;
            this.saveRides(rides);
        }
    }

    // Clear user tracking on logout
    clearUserTracking() {
        localStorage.removeItem(this.USER_TRACKING_KEY);
    }

    // Debug function to log current state
    debug() {
        console.log('=== TaxiRideStorageService Debug ===');
        console.log('Current user:', this.getCurrentUser());
        console.log('User rides key:', this.getUserRidesKey());
        console.log('Last tracked user:', localStorage.getItem(this.USER_TRACKING_KEY));
        console.log('Current rides:', this.getRides());
        console.log('All localStorage keys with "taxi":', 
            Object.keys(localStorage).filter(key => key.includes('taxi')));
        console.log('=====================================');
    }

    // Manual clear function for testing
    manualClear() {
        console.log('🧹 TaxiRideStorageService: Manual clear initiated');
        this.clearAllRides();
        this.clearUserTracking();
        console.log('🧹 TaxiRideStorageService: Manual clear completed');
    }
}

// Export singleton instance
export const taxiRideStorage = new TaxiRideStorageService();
