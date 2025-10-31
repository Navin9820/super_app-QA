// Centralized Maps Configuration for Rider App
// This file manages Google Maps API configuration for taxi/porter modules

const MAPS_CONFIG = {
  // Enable/Disable maps globally
  ENABLED: process.env.REACT_APP_MAPS_ENABLED !== 'false',
  
  // Primary map provider (Google Maps for taxi/porter)
  PROVIDER: 'google',
  
  // API Keys (loaded from environment variables)
  API_KEYS: {
    GOOGLE: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyB_IWKJcJhkGzpCDB-ml6vlZmQzd-4F-gg',
    LOCATIONIQ: process.env.REACT_APP_LOCATIONIQ_API_KEY || 'pk.e62ffd62f56c72b6eb9c10981bb3ba3d'
  },
  
  // Cost Protection - Usage Limits
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
    FALLBACKS: ['osm'],
    
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

export default MAPS_CONFIG;
