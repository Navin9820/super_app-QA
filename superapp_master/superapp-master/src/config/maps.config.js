// Centralized Maps Configuration with Cost Protection
// This file manages all map providers, API keys, and usage limits

const MAPS_CONFIG = {
  // Enable/Disable maps globally
  ENABLED: process.env.REACT_APP_MAPS_ENABLED !== 'false',
  
  // Primary map provider (can be 'google', 'osm', or 'locationiq')
  PROVIDER: process.env.REACT_APP_MAP_PROVIDER || 'google',
  
  // API Keys (loaded from environment variables)
  API_KEYS: {
    GOOGLE: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyB_IWKJcJhkGzpCDB-ml6vlZmQzd-4F-gg',
    LOCATIONIQ: process.env.REACT_APP_LOCATIONIQ_API_KEY || null
  },
  
  // Cost Protection - Usage Limits (Prevents Surprises)
  USAGE_LIMITS: {
    DAILY: {
      MAP_LOADS: 1000,        // Map views per day
      GEOCODING: 500,         // Address searches per day
      ROUTING: 200,           // Route calculations per day
      PLACES: 300             // Address autocomplete per day
    },
    WARNING_THRESHOLD: 0.8,   // Show warning at 80% of limit
    FALLBACK_THRESHOLD: 0.95  // Switch to fallback at 95% of limit
  },
  
  // Map Providers Configuration
  PROVIDERS: {
    GOOGLE: {
      name: 'Google Maps',
      enabled: true,
      tileUrl: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      attribution: '© Google Maps',
      maxZoom: 20,
      costPerRequest: {
        mapLoad: 0.007,      // $0.007 per map load
        geocoding: 0.005,    // $0.005 per geocoding request
        routing: 0.005,      // $0.005 per routing request
        places: 0.017        // $0.017 per places request
      }
    },
    OPENSTREETMAP: {
      name: 'OpenStreetMap',
      enabled: true,
      tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      costPerRequest: {
        mapLoad: 0,          // Free
        geocoding: 0,        // Free (Nominatim)
        routing: 0,          // Free (OSRM)
        places: 0            // Free
      }
    },
    LOCATIONIQ: {
      name: 'LocationIQ',
      enabled: !!process.env.REACT_APP_LOCATIONIQ_API_KEY,
      tileUrl: 'https://tiles.locationiq.com/tiles/v3/{z}/{x}/{y}.png?key={key}',
      attribution: '© LocationIQ',
      maxZoom: 18,
      costPerRequest: {
        mapLoad: 0,          // Free tier
        geocoding: 0,        // Free tier
        routing: 0,          // Free tier
        places: 0            // Free tier
      }
    }
  },
  
  // Default Map Settings
  DEFAULTS: {
    CENTER: [13.0827, 80.2707], // Chennai, India
    ZOOM: 13,
    MIN_ZOOM: 8,
    MAX_ZOOM: 18
  },
  
  // Fallback Strategy
  FALLBACK_STRATEGY: {
    // If Google hits limits, switch to OpenStreetMap
    PRIMARY: 'google',
    FALLBACKS: ['osm', 'locationiq'],
    
    // Automatic fallback triggers
    TRIGGERS: {
      RATE_LIMIT: true,      // Switch on rate limit errors
      QUOTA_EXCEEDED: true,  // Switch on quota exceeded
      DAILY_LIMIT: true,     // Switch on daily limit reached
      NETWORK_ERROR: true    // Switch on network failures
    }
  },
  
  // Cost Monitoring
  MONITORING: {
    ENABLED: true,
    LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
    ALERT_THRESHOLD: 0.8, // Alert at 80% of daily limit
    AUTO_FALLBACK: true   // Automatically switch providers
  }
};

// Usage Tracking (In-Memory for Development)
class UsageTracker {
  constructor() {
    this.resetDaily();
    this.loadFromStorage();
  }
  
  resetDaily() {
    const today = new Date().toDateString();
    if (this.lastReset !== today) {
      this.usage = {
        MAP_LOADS: 0,
        GEOCODING: 0,
        ROUTING: 0,
        PLACES: 0
      };
      this.lastReset = today;
      this.saveToStorage();
    }
  }
  
  track(type) {
    this.resetDaily();
    if (this.usage[type] !== undefined) {
      this.usage[type]++;
      this.saveToStorage();
      this.checkLimits(type);
    }
  }
  
  checkLimits(type) {
    const limit = MAPS_CONFIG.USAGE_LIMITS.DAILY[type];
    const current = this.usage[type];
    const percentage = current / limit;
    
    if (percentage >= MAPS_CONFIG.USAGE_LIMITS.FALLBACK_THRESHOLD) {
      console.warn(`⚠️ Maps: ${type} usage at ${Math.round(percentage * 100)}% of daily limit. Switching to fallback provider.`);
      this.switchToFallback();
    } else if (percentage >= MAPS_CONFIG.USAGE_LIMITS.WARNING_THRESHOLD) {
      console.warn(`⚠️ Maps: ${type} usage at ${Math.round(percentage * 100)}% of daily limit.`);
    }
    
    // Log usage for monitoring
    if (MAPS_CONFIG.MONITORING.LOG_LEVEL === 'info') {
      console.log(`🗺️ Maps Usage: ${current}/${limit} ${type} today`);
    }
  }
  
  switchToFallback() {
    if (MAPS_CONFIG.MONITORING.AUTO_FALLBACK) {
      const currentProvider = MAPS_CONFIG.PROVIDER;
      const fallbacks = MAPS_CONFIG.FALLBACK_STRATEGY.FALLBACKS;
      
      for (const fallback of fallbacks) {
        if (MAPS_CONFIG.PROVIDERS[fallback.toUpperCase()]?.enabled) {
          console.log(`🔄 Maps: Switching from ${currentProvider} to ${fallback} due to usage limits`);
          MAPS_CONFIG.PROVIDER = fallback;
          break;
        }
      }
    }
  }
  
  saveToStorage() {
    try {
      localStorage.setItem('maps_usage', JSON.stringify({
        usage: this.usage,
        lastReset: this.lastReset
      }));
    } catch (e) {
      // Ignore storage errors
    }
  }
  
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('maps_usage');
      if (stored) {
        const data = JSON.parse(stored);
        this.usage = data.usage || this.usage;
        this.lastReset = data.lastReset || this.lastReset;
      }
    } catch (e) {
      // Ignore storage errors
    }
  }
  
  getUsage() {
    this.resetDaily();
    return { ...this.usage };
  }
  
  getUsagePercentage() {
    this.resetDaily();
    const percentages = {};
    Object.keys(this.usage).forEach(type => {
      const limit = MAPS_CONFIG.USAGE_LIMITS.DAILY[type];
      percentages[type] = this.usage[type] / limit;
    });
    return percentages;
  }
}

// Initialize usage tracker
const usageTracker = new UsageTracker();

// Helper Functions
const getCurrentProvider = () => {
  return MAPS_CONFIG.PROVIDERS[MAPS_CONFIG.PROVIDER.toUpperCase()];
};

const isProviderEnabled = (provider) => {
  return MAPS_CONFIG.PROVIDERS[provider.toUpperCase()]?.enabled;
};

const getTileUrl = (provider = null) => {
  const currentProvider = provider || MAPS_CONFIG.PROVIDER;
  const config = MAPS_CONFIG.PROVIDERS[currentProvider.toUpperCase()];
  
  if (!config) return MAPS_CONFIG.PROVIDERS.OPENSTREETMAP.tileUrl;
  
  let url = config.tileUrl;
  if (currentProvider === 'locationiq' && MAPS_CONFIG.API_KEYS.LOCATIONIQ) {
    url = url.replace('{key}', MAPS_CONFIG.API_KEYS.LOCATIONIQ);
  }
  
  return url;
};

const getAttribution = (provider = null) => {
  const currentProvider = provider || MAPS_CONFIG.PROVIDER;
  const config = MAPS_CONFIG.PROVIDERS[currentProvider.toUpperCase()];
  return config?.attribution || MAPS_CONFIG.PROVIDERS.OPENSTREETMAP.attribution;
};

const trackUsage = (type) => {
  if (MAPS_CONFIG.ENABLED && MAPS_CONFIG.MONITORING.ENABLED) {
    usageTracker.track(type);
  }
};

// Export configuration and utilities
export {
  MAPS_CONFIG,
  usageTracker,
  getCurrentProvider,
  isProviderEnabled,
  getTileUrl,
  getAttribution,
  trackUsage
};

export default MAPS_CONFIG;
