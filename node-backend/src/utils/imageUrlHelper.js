// Helper function to handle image URLs consistently across all controllers
// Supports both Base64 data URLs and file paths

function processImageUrl(imagePath, baseUrl, itemId = null, itemType = null) {
  if (!imagePath || imagePath.trim() === '') {
    return null;
  }

  // If it's already a full URL, return it as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // If it's a Base64 data URL, use the API endpoint instead
  if (imagePath.startsWith('data:image/')) {
    if (itemId && itemType) {
      // ✅ FIXED: Add cache-busting parameter to ensure updated images are loaded
      const timestamp = Date.now();
      return `${baseUrl}/api/image/${itemType}/${itemId}?t=${timestamp}`;
    }
    // Fallback: return the Base64 data URL (not recommended for large images)
    return imagePath;
  }
  
  // Handle file paths - ensure the path starts with a slash if it doesn't already
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${baseUrl}${normalizedPath}`;
}

// Helper function to get base URL from request
function getBaseUrl(req) {
  let baseUrl = process.env.BACKEND_URL || process.env.BASE_URL;
  
  if (!baseUrl) {
    // ✅ FIXED: Always use HTTP for localhost development
    if (req.get('host') && req.get('host').includes('localhost')) {
      baseUrl = `http://${req.get('host')}`;
    } else if (process.env.NODE_ENV === 'production' || req.get('x-forwarded-proto') === 'https') {
      baseUrl = `https://${req.get('host')}`;
    } else {
      baseUrl = `${req.protocol}://${req.get('host')}`;
    }
  }
  
  return baseUrl;
}

module.exports = {
  processImageUrl,
  getBaseUrl
};
