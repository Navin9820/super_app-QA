const jwt = require('jsonwebtoken');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testCurrentStatus() {
  try {
    console.log('🔍 Testing current server status...');
    
    const payload = {
      id: '507f1f77bcf86cd799439011',
      type: 'rider',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60)
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
    
    const testOrderId = '68cce3b1ca617a66dbb9cba2';
    const url = `http://localhost:5000/api/riders/orders/${testOrderId}/status`;
    
    const requestBody = {
      status: 'out_for_delivery',
      order_type: 'porter'
    };
    
    console.log('🔍 Testing with status:', requestBody.status);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('🔍 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('🔍 Response body:', responseText);
    
    if (response.status === 200) {
      console.log('✅ Server is running the updated code - All good!');
    } else {
      console.log('❌ Server still has issues');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCurrentStatus();
