import React, { useState } from 'react';
import { useCart } from '../Utility/CartContext';
import { addToWishlist as apiAddToWishlist } from '../services/cartWishlistService';

const WishlistDebug = () => {
  const { addToWishlist, wishlist } = useCart();
  const [testProductId, setTestProductId] = useState('test123');
  const [testQuantity, setTestQuantity] = useState(1);
  const [debugLog, setDebugLog] = useState([]);

  const addLog = (message) => {
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDirectServiceCall = async () => {
    try {
      addLog('🔍 Testing direct service call...');
      addLog(`Product ID: ${testProductId}, Quantity: ${testQuantity}`);
      
      const result = await apiAddToWishlist({ productId: testProductId, quantity: testQuantity });
      addLog(`✅ Service call successful: ${JSON.stringify(result)}`);
    } catch (error) {
      addLog(`❌ Service call failed: ${error.message}`);
      console.error('Service error:', error);
    }
  };

  const testContextCall = async () => {
    try {
      addLog('🔍 Testing context call...');
      addLog(`Product ID: ${testProductId}, Quantity: ${testQuantity}`);
      
      const result = await addToWishlist(testProductId, testQuantity);
      addLog(`✅ Context call successful: ${JSON.stringify(result)}`);
    } catch (error) {
      addLog(`❌ Context call failed: ${error.message}`);
      console.error('Context error:', error);
    }
  };

  const testWithDifferentIds = async () => {
    const testCases = [
      { id: 'test123', desc: 'String ID' },
      { id: 123, desc: 'Number ID' },
      { id: null, desc: 'Null ID' },
      { id: undefined, desc: 'Undefined ID' },
      { id: '', desc: 'Empty string ID' }
    ];

    for (const testCase of testCases) {
      try {
        addLog(`🔍 Testing ${testCase.desc}: ${testCase.id}`);
        const result = await apiAddToWishlist({ productId: testCase.id, quantity: 1 });
        addLog(`✅ ${testCase.desc} successful: ${JSON.stringify(result)}`);
      } catch (error) {
        addLog(`❌ ${testCase.desc} failed: ${error.message}`);
      }
    }
  };

  const clearLog = () => {
    setDebugLog([]);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Wishlist Debug Tool</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Test Controls */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Test Controls</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Test Product ID:</label>
                <input
                  type="text"
                  value={testProductId}
                  onChange={(e) => setTestProductId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Enter product ID to test"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Test Quantity:</label>
                <input
                  type="number"
                  value={testQuantity}
                  onChange={(e) => setTestQuantity(parseInt(e.target.value) || 1)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  min="1"
                />
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={testDirectServiceCall}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  Test Direct Service Call
                </button>
                
                <button
                  onClick={testContextCall}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                >
                  Test Context Call
                </button>
                
                <button
                  onClick={testWithDifferentIds}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
                >
                  Test Different ID Types
                </button>
                
                <button
                  onClick={clearLog}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
                >
                  Clear Log
                </button>
              </div>
            </div>
          </div>
          
          {/* Current State */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Current State</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Current Wishlist:</label>
                <div className="bg-gray-50 p-2 rounded text-sm">
                  {wishlist.length > 0 ? (
                    <pre>{JSON.stringify(wishlist, null, 2)}</pre>
                  ) : (
                    <span className="text-gray-500">Empty</span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Wishlist Count:</label>
                <span className="text-lg font-bold text-blue-600">{wishlist.length}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Debug Log */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Debug Log</h2>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {debugLog.length > 0 ? (
              debugLog.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            ) : (
              <span className="text-gray-500">No logs yet. Run a test to see results.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistDebug;
