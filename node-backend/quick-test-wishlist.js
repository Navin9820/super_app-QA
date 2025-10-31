const axios = require('axios');

// Quick test for wishlist remove endpoint
async function quickTest() {
  try {
    console.log('🧪 Quick Test: Checking if /api/wishlist/remove endpoint exists...\n');
    
    // Test if the endpoint responds (even with invalid token)
    const response = await axios.post('http://localhost:5000/api/wishlist/remove', {
      item_id: '507f1f77bcf86cd799439011'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('❌ Endpoint exists but should require authentication');
    console.log('Response:', response.data);
    
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        console.log('✅ Endpoint exists and requires authentication!');
        console.log('Status:', error.response.status);
        console.log('Message:', error.response.data.message);
      } else if (error.response.status === 404) {
        console.log('❌ Endpoint not found (404) - Server needs restart!');
        console.log('Status:', error.response.status);
      } else {
        console.log('✅ Endpoint exists with status:', error.response.status);
        console.log('Response:', error.response.data);
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running on port 5000');
      console.log('Start your server with: npm run dev');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
}

// Run the test
quickTest();
