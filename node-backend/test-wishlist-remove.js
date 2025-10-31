const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER_TOKEN = 'your_test_token_here'; // Replace with actual token

// Test the new wishlist remove endpoint
async function testWishlistRemove() {
  try {
    console.log('🧪 Testing Wishlist Remove Functionality...\n');

    // Test 1: Remove item using POST /remove endpoint
    console.log('1️⃣ Testing POST /api/wishlist/remove endpoint...');
    
    const removeResponse = await axios.post(`${BASE_URL}/wishlist/remove`, {
      item_id: '507f1f77bcf86cd799439011' // Example MongoDB ObjectId
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Remove response:', removeResponse.data);
    console.log('Status:', removeResponse.status);

    // Test 2: Try to clear wishlist without clear_all flag (should fail)
    console.log('\n2️⃣ Testing DELETE /api/wishlist without clear_all flag...');
    
    try {
      const clearResponse = await axios.delete(`${BASE_URL}/wishlist`, {
        headers: {
          'Authorization': `Bearer ${TEST_USER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ This should have failed but got:', clearResponse.data);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly prevented accidental clearing:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test 3: Clear wishlist with explicit clear_all flag
    console.log('\n3️⃣ Testing DELETE /api/wishlist with clear_all: true...');
    
    const clearAllResponse = await axios.delete(`${BASE_URL}/wishlist`, {
      data: { clear_all: true },
      headers: {
        'Authorization': `Bearer ${TEST_USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Clear all response:', clearAllResponse.data);
    console.log('Status:', clearAllResponse.status);

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
if (require.main === module) {
  testWishlistRemove();
}

module.exports = { testWishlistRemove };
