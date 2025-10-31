/**
 * Universal Image URL Generator
 * Works for all hosting services: localhost, Vercel, AWS, etc.
 */

export const getDynamicImageUrl = (imagePath, options = {}) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('data:')) return imagePath;
  
  // Auto-detect environment
  const isLocalhost = window.location.host.includes('localhost');
  const frontendProtocol = window.location.protocol; // 'http:' or 'https:'
  const frontendHost = window.location.host; // 'localhost:3001' or 'yourdomain.vercel.app'
  
  // Configuration options
  const {
    backendHost = 'localhost:5000',
    backendProtocol = 'http:',
    uploadsPath = '/uploads',
    defaultSubfolder = 'products'
  } = options;
  
  if (isLocalhost) {
    // Localhost: Use HTTP backend
    if (imagePath.startsWith('/uploads/')) {
      return `${backendProtocol}//${backendHost}${imagePath}`;
    } else if (imagePath.startsWith('products/')) {
      return `${backendProtocol}//${backendHost}${uploadsPath}/${imagePath}`;
    } else {
      return `${backendProtocol}//${backendHost}${uploadsPath}/${defaultSubfolder}/${imagePath}`;
    }
  } else {
    // Production: Use same protocol as frontend
    const productionHost = frontendHost.replace(/:\d+$/, ''); // Remove port if present
    
    if (imagePath.startsWith('/uploads/')) {
      return `${frontendProtocol}//${productionHost}${imagePath}`;
    } else if (imagePath.startsWith('products/')) {
      return `${frontendProtocol}//${productionHost}${uploadsPath}/${imagePath}`;
    } else {
      return `${frontendProtocol}//${productionHost}${uploadsPath}/${defaultSubfolder}/${imagePath}`;
    }
  }
};

// Specialized functions for different modules
export const getProductImageUrl = (imagePath) => {
  // ✅ FIXED: If backend already sends absolute URLs, return them as-is
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('data:')) return imagePath;
  
  // Only process relative paths
  return getDynamicImageUrl(imagePath, { defaultSubfolder: 'products' });
};

export const getBrandImageUrl = (imagePath) => {
  // ✅ FIXED: If backend already sends absolute URLs, return them as-is
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('data:')) return imagePath;
  
  // Only process relative paths
  return getDynamicImageUrl(imagePath, { defaultSubfolder: 'brands' });
};

export const getCategoryImageUrl = (imagePath) => {
  // ✅ FIXED: If backend already sends absolute URLs, return them as-is
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('data:')) return imagePath;
  
  // Only process relative paths
  return getDynamicImageUrl(imagePath, { defaultSubfolder: 'categories' });
};

export const getHotelImageUrl = (imagePath) => {
  // ✅ FIXED: If backend already sends absolute URLs, return them as-is
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('data:')) return imagePath;
  
  // Only process relative paths
  return getDynamicImageUrl(imagePath, { defaultSubfolder: 'hotels' });
};

export const getRestaurantImageUrl = (imagePath) => {
  // ✅ FIXED: If backend already sends absolute URLs, return them as-is
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('data:')) return imagePath;
  
  // Only process relative paths
  return getDynamicImageUrl(imagePath, { defaultSubfolder: 'restaurants' });
};

// Environment detection helpers
export const isLocalhost = () => window.location.host.includes('localhost');
export const isProduction = () => !isLocalhost();
export const getCurrentProtocol = () => window.location.protocol;
export const getCurrentHost = () => window.location.host;
