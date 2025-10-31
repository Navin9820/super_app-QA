const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const createUploadsDir = (dir) => {
  const uploadDir = path.join(__dirname, '../../uploads', dir);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = '';
    
    // Determine upload path based on file type
    if (file.fieldname === 'product_image') {
      uploadPath = createUploadsDir('products');
    } else if (file.fieldname === 'multiple_images') {
      uploadPath = createUploadsDir('products');
    } else if (file.fieldname === 'category_image') {
      uploadPath = createUploadsDir('categories');
    } else if (file.fieldname === 'profile_picture') {
      uploadPath = createUploadsDir('profiles');
    } else if (file.fieldname === 'main_image') {
      uploadPath = createUploadsDir('hotels');
    } else if (file.fieldname === 'attribute_image') {
      uploadPath = createUploadsDir('hotel_attributes');
    } else if (file.fieldname === 'icon') {
      uploadPath = createUploadsDir('hotel_attributes');
    } else if (file.fieldname === 'images') { // <-- add this for room images
      uploadPath = createUploadsDir('rooms');
    } else if (file.fieldname === 'license_file') { // ✅ NEW: Driver license files
      uploadPath = createUploadsDir('drivers');
    } else {
      uploadPath = createUploadsDir('others');
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter with detailed error messages
const fileFilter = (req, file, cb) => {
  console.log('🔍 DEBUG: Multer file filter called for field:', file.fieldname);
  console.log('File details:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  
  // ✅ ENHANCED: Support for driver license files (including PDFs)
  if (file.fieldname === 'license_file') {
    // Allow JPG, PNG, and PDF for driver licenses
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid license file type. Only JPG, PNG, and PDF files are allowed.'), false);
    }
    
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error('Invalid license file extension. Only .jpg, .jpeg, .png, and .pdf files are allowed.'), false);
    }
    
    cb(null, true);
  } else {
    // ✅ EXISTING: Standard image validation for other files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG and GIF images are allowed.'), false);
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
      return cb(new Error('Invalid file extension. Only .jpg, .jpeg, .png and .gif files are allowed.'), false);
    }

    cb(null, true);
  }
};

// Error handling middleware
const handleMulterError = (err, req, res, next) => {
  console.log('🔍 DEBUG: Multer error handler called:', err);
  
  if (err instanceof multer.MulterError) {
    console.log('❌ DEBUG: Multer error:', err.code, err.message);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File size too large. Maximum size is 5MB'
      });
    }
    return res.status(400).json({
      message: `Upload error: ${err.message}`
    });
  }
  if (err) {
    console.log('❌ DEBUG: General error:', err.message);
    return res.status(400).json({
      message: err.message
    });
  }
  next();
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// ✅ FIXED: Proper export
module.exports = upload;
module.exports.handleMulterError = handleMulterError; 