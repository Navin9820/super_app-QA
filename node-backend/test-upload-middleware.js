/**
 * 🧪 Test Upload Middleware Script
 * 
 * This script tests if the upload middleware is working correctly
 */

console.log('🧪 Testing Upload Middleware...');

try {
  // Test 1: Import upload middleware
  console.log('📥 Importing upload middleware...');
  const upload = require('./src/middlewares/upload.middleware');
  
  if (!upload) {
    throw new Error('Upload middleware is undefined');
  }
  
  console.log('✅ Upload middleware imported successfully');
  console.log('📋 Upload middleware type:', typeof upload);
  console.log('📋 Upload.single type:', typeof upload.single);
  
  // Test 2: Check if upload.single exists
  if (typeof upload.single !== 'function') {
    throw new Error('upload.single is not a function');
  }
  
  console.log('✅ upload.single is available and is a function');
  
  // Test 3: Check if upload.fields exists
  if (typeof upload.fields !== 'function') {
    console.log('⚠️ upload.fields is not available');
  } else {
    console.log('✅ upload.fields is available');
  }
  
  // Test 4: Check if upload.array exists
  if (typeof upload.array !== 'function') {
    console.log('⚠️ upload.array is not available');
  } else {
    console.log('✅ upload.array is available');
  }
  
  console.log('\n🎉 All upload middleware tests passed!');
  
} catch (error) {
  console.error('❌ Upload middleware test failed:', error.message);
  console.error('Stack trace:', error.stack);
  
  // Try to debug the issue
  console.log('\n🔍 Debugging information:');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const middlewarePath = './src/middlewares/upload.middleware.js';
    if (fs.existsSync(middlewarePath)) {
      console.log('✅ Middleware file exists');
      const stats = fs.statSync(middlewarePath);
      console.log('📁 File size:', stats.size, 'bytes');
      console.log('📁 Last modified:', stats.mtime);
    } else {
      console.log('❌ Middleware file does not exist');
    }
    
    // Check if multer is installed
    try {
      const multer = require('multer');
      console.log('✅ Multer package is available');
      console.log('📋 Multer version:', multer.version || 'Unknown');
    } catch (multerError) {
      console.log('❌ Multer package error:', multerError.message);
    }
    
  } catch (debugError) {
    console.log('❌ Debug error:', debugError.message);
  }
}
