const path = require('path');

const validateImage = (req, res, next) => {
  // Handle both single file and multiple files
  const files = req.file ? [req.file] : (req.files ? Object.values(req.files).flat() : []);
  
  // For update operations (PUT), image is optional, so skip validation if no files
  if (files.length === 0 && req.method === 'PUT') {
    return next();
  }
  
  // For create operations (POST), image is required
  if (files.length === 0) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }

  // Enhanced validation for different file types
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  for (const file of files) {
    // Special handling for license files (allow PDFs)
    if (file.fieldname === 'license_file') {
      const licenseAllowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!licenseAllowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ 
          message: 'Invalid license file type. Only JPEG, PNG and PDF files are allowed' 
        });
      }
    } else {
      // Standard image validation for other files
      const imageAllowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!imageAllowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ 
          message: 'Invalid file type. Only JPEG, PNG and GIF images are allowed' 
        });
      }
    }

    if (file.size > maxSize) {
      return res.status(400).json({ 
        message: 'File size too large. Maximum size is 5MB' 
      });
    }
  }

  next();
};

module.exports = { validateImage }; 