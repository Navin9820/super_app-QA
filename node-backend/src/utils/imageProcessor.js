const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const processImage = async (file, options = {}, subfolder = 'others') => {
  const {
    width = 800,
    height = 800,
    quality = 80,
    format = 'jpeg',
    fit = 'inside',
    position = 'center',
    storeInDatabase = true // New option to store in database
  } = options;

  // Generate a unique filename to prevent conflicts
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
  const extension = path.extname(file.originalname) || `.${format}`;
  const filename = `${path.basename(file.originalname, extension)}-${uniqueSuffix}${extension}`;
  
  // Define the output directory (uploads, not public/uploads)
  const outputDir = path.join(__dirname, '..', '..', 'uploads', subfolder);
  const processedPath = path.join(outputDir, filename);

  try {
    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Get image metadata
    const metadata = await sharp(file.path).metadata();

    // Process image with optimization
    const processedImage = sharp(file.path)
      .resize(width, height, {
        fit,
        position,
        withoutEnlargement: true
      });

    // Apply format-specific optimizations
    if (format === 'jpeg') {
      processedImage.jpeg({ quality, progressive: true });
    } else if (format === 'png') {
      processedImage.png({ quality, compressionLevel: 9 });
    } else if (format === 'gif') {
      processedImage.gif();
    }

    // Save processed image to the public directory
    await processedImage.toFile(processedPath);

    // Convert to Base64 for database storage
    let base64Data = null;
    if (storeInDatabase) {
      const imageBuffer = await processedImage.toBuffer();
      const mimeType = `image/${format}`;
      base64Data = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
    }

    // Delete the original temporary file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Return processed file info with metadata
    return {
      ...file,
      path: processedPath,
      filename: filename, // The new permanent filename
      base64Data: base64Data, // Base64 data for database storage
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: fs.statSync(processedPath).size
      }
    };
  } catch (error) {
    console.error('Error processing image:', error);
    
    // If processing fails, clean up any failed attempts
    if (fs.existsSync(processedPath)) {
      fs.unlinkSync(processedPath);
    }
    
    // Also clean up the original temp file
    if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
    }
    
    throw new Error(`Image processing failed: ${error.message}`);
  }
};

// Helper function to validate image dimensions
const validateImageDimensions = async (file, minWidth = 100, minHeight = 100) => {
  try {
    const metadata = await sharp(file.path).metadata();
    if (metadata.width < minWidth || metadata.height < minHeight) {
      throw new Error(`Image dimensions too small. Minimum size is ${minWidth}x${minHeight}px`);
    }
    return true;
  } catch (error) {
    throw new Error(`Image validation failed: ${error.message}`);
  }
};

// Helper function to process image for database storage only (no local file)
const processImageForDatabase = async (file, options = {}) => {
  const {
    width = 800,
    height = 800,
    quality = 80,
    format = 'jpeg',
    fit = 'inside',
    position = 'center'
  } = options;

  try {
    // Get image metadata
    const metadata = await sharp(file.path).metadata();

    // Process image with optimization
    const processedImage = sharp(file.path)
      .resize(width, height, {
        fit,
        position,
        withoutEnlargement: true
      });

    // Apply format-specific optimizations
    if (format === 'jpeg') {
      processedImage.jpeg({ quality, progressive: true });
    } else if (format === 'png') {
      processedImage.png({ quality, compressionLevel: 9 });
    } else if (format === 'gif') {
      processedImage.gif();
    }

    // Convert to Base64 for database storage
    const imageBuffer = await processedImage.toBuffer();
    const mimeType = `image/${format}`;
    const base64Data = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

    // Delete the original temporary file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Return Base64 data and metadata
    return {
      base64Data: base64Data,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: imageBuffer.length
      }
    };
  } catch (error) {
    console.error('Error processing image for database:', error);
    
    // Clean up the original temp file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    
    throw new Error(`Image processing for database failed: ${error.message}`);
  }
};

// Helper function to process image for hybrid storage (both file path and base64)
const processImageForHybrid = async (file, options = {}) => {
  const {
    width = 800,
    height = 800,
    quality = 80,
    format = 'jpeg',
    fit = 'inside',
    position = 'center',
    subfolder = 'products'
  } = options;

  try {
    // Generate a unique filename to prevent conflicts
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const extension = path.extname(file.originalname) || `.${format}`;
    const filename = `${path.basename(file.originalname, extension)}-${uniqueSuffix}${extension}`;
    
    // Define the output directory
    const outputDir = path.join(__dirname, '..', '..', 'uploads', subfolder);
    const processedPath = path.join(outputDir, filename);

    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Get image metadata
    const metadata = await sharp(file.path).metadata();

    // Process image with optimization
    const processedImage = sharp(file.path)
      .resize(width, height, {
        fit,
        position,
        withoutEnlargement: true
      });

    // Apply format-specific optimizations
    if (format === 'jpeg') {
      processedImage.jpeg({ quality, progressive: true });
    } else if (format === 'png') {
      processedImage.png({ quality, compressionLevel: 9 });
    } else if (format === 'gif') {
      processedImage.gif();
    }

    // Save processed image to file
    await processedImage.toFile(processedPath);

    // Convert to Base64 for database storage (backward compatibility)
    const imageBuffer = await processedImage.toBuffer();
    const mimeType = `image/${format}`;
    const base64Data = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

    // Delete the original temporary file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Return both file path and base64 data
    return {
      filePath: `/uploads/${subfolder}/${filename}`, // File path for new storage
      base64Data: base64Data, // Base64 for backward compatibility
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: fs.statSync(processedPath).size
      }
    };
  } catch (error) {
    console.error('Error processing image for hybrid storage:', error);
    
    // Clean up the original temp file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    
    throw new Error(`Image processing for hybrid storage failed: ${error.message}`);
  }
};

module.exports = {
  processImage,
  processImageForDatabase,
  processImageForHybrid,
  validateImageDimensions
}; 