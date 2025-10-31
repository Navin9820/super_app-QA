// Test script for unified rider login system
const axios = require('axios');

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function testUnifiedLogin() {
  console.log('🧪 Testing Unified Rider Login System...\n');

  try {
    // Test 1: Try to login with approved porter driver credentials
    console.log('🔍 Test 1: Login with approved porter driver');
    const porterLoginResponse = await axios.post(`${BASE_URL}/riders/login`, {
      email: 'keekavinilavan@gmail.com', // This was approved in the logs
      password: 'password123' // Assuming this was the password used
    });
    
    console.log('✅ Porter Driver Login Success:');
    console.log('   - User Type:', porterLoginResponse.data.data.user_type);
    console.log('   - Driver Data:', porterLoginResponse.data.data.driver_data);
    console.log('   - Token:', porterLoginResponse.data.token.substring(0, 20) + '...');
    console.log('');

    // Test 2: Try to login with approved taxi driver credentials
    console.log('🔍 Test 2: Login with approved taxi driver');
    const taxiLoginResponse = await axios.post(`${BASE_URL}/riders/login`, {
      email: 'caspiannilavan1@gmail.com', // This was approved in the logs
      password: 'password123' // Assuming this was the password used
    });
    
    console.log('✅ Taxi Driver Login Success:');
    console.log('   - User Type:', taxiLoginResponse.data.data.user_type);
    console.log('   - Driver Data:', taxiLoginResponse.data.data.driver_data);
    console.log('   - Token:', taxiLoginResponse.data.token.substring(0, 20) + '...');
    console.log('');

    // Test 3: Test profile endpoint with taxi driver token
    console.log('🔍 Test 3: Get profile with taxi driver token');
    const taxiProfileResponse = await axios.get(`${BASE_URL}/riders/profile`, {
      headers: {
        'Authorization': `Bearer ${taxiLoginResponse.data.token}`
      }
    });
    
    console.log('✅ Taxi Driver Profile Success:');
    console.log('   - User Type:', taxiProfileResponse.data.data.user_type);
    console.log('   - Name:', taxiProfileResponse.data.data.name);
    console.log('   - Status:', taxiProfileResponse.data.data.status);
    console.log('');

    console.log('🎉 All tests passed! Unified login system is working!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 This might be due to incorrect password. Please check:');
      console.log('   1. The password used during driver registration');
      console.log('   2. That the driver was actually approved in admin panel');
      console.log('   3. That the backend is running and accessible');
    }
  }
}

// Run the test
testUnifiedLogin();
