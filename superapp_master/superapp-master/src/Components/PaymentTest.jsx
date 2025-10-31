import React, { useState } from 'react';
import PaymentButton from './PaymentButton';
import paymentService from '../services/paymentService';

const PaymentTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const testPaymentMethods = [
    { id: 'paytm', name: 'Paytm', type: 'UPI' },
    { id: 'phonepay', name: 'PhonePe', type: 'UPI' },
    { id: 'amazonpay', name: 'Amazon Pay', type: 'UPI' },
    { id: 'creditdebit', name: 'Credit/Debit Card', type: 'Card' },
    { id: 'hdfc', name: 'HDFC Bank', type: 'Net Banking' },
    { id: 'icici', name: 'ICICI Bank', type: 'Net Banking' },
    { id: 'sbi', name: 'SBI Bank', type: 'Net Banking' },
    { id: 'axis', name: 'AXIS Bank', type: 'Net Banking' },
    { id: 'kotak', name: 'Kotak Bank', type: 'Net Banking' },
    { id: 'wallet', name: 'Wallet', type: 'Wallet' }
  ];

  const testPaymentMethod = async (method) => {
    setIsLoading(true);
    
    const testOrderData = {
      amount: 100, // ₹1 for testing
      currency: 'INR',
      order_id: `TEST_${method.id}_${Date.now()}`,
      order_model: 'Order',
      description: `Test payment via ${method.name}`,
      email: 'test@example.com',
      contact: '+91 9876543210',
      customerName: 'Test User',
      payment_method: method.id,
      payment_notes: `Test payment via ${method.name}`
    };

    try {
      // Test payment configuration
      const config = paymentService.getPaymentMethodConfig(method.id);
      
      setTestResults(prev => [...prev, {
        method: method.name,
        status: 'success',
        message: `✅ ${method.name} configuration loaded successfully`,
        config: config
      }]);

      // Test payment processing (without actually processing)
      await paymentService.processPayment(testOrderData, {
        onSuccess: (data) => {
          setTestResults(prev => [...prev, {
            method: method.name,
            status: 'success',
            message: `✅ ${method.name} payment successful`,
            data: data
          }]);
        },
        onError: (error) => {
          setTestResults(prev => [...prev, {
            method: method.name,
            status: 'error',
            message: `❌ ${method.name} payment failed: ${error.message}`,
            error: error
          }]);
        },
        onCancel: () => {
          setTestResults(prev => [...prev, {
            method: method.name,
            status: 'cancelled',
            message: `⚠️ ${method.name} payment cancelled by user`
          }]);
        }
      });

    } catch (error) {
      setTestResults(prev => [...prev, {
        method: method.name,
        status: 'error',
        message: `❌ ${method.name} test failed: ${error.message}`,
        error: error
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Payment Methods Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {testPaymentMethods.map((method) => (
          <div key={method.id} className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg">{method.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{method.type}</p>
            
            <button
              onClick={() => testPaymentMethod(method)}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Testing...' : `Test ${method.name}`}
            </button>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <button
          onClick={clearResults}
          className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
        >
          Clear Results
        </button>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Test Results:</h2>
        {testResults.length === 0 ? (
          <p className="text-gray-500">No test results yet. Click on a payment method to test.</p>
        ) : (
          testResults.map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded border ${
                result.status === 'success' ? 'bg-green-50 border-green-200' :
                result.status === 'error' ? 'bg-red-50 border-red-200' :
                'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{result.message}</p>
                  {result.config && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600">
                        View Configuration
                      </summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(result.config, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                <span className={`text-sm px-2 py-1 rounded ${
                  result.status === 'success' ? 'bg-green-200 text-green-800' :
                  result.status === 'error' ? 'bg-red-200 text-red-800' :
                  'bg-yellow-200 text-yellow-800'
                }`}>
                  {result.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Testing Instructions:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Click on any payment method to test its configuration</li>
          <li>For UPI methods: Use test UPI ID like "test@razorpay"</li>
          <li>For cards: Use test card number "4111 1111 1111 1111"</li>
          <li>For net banking: Use any test credentials</li>
          <li>All payments will be processed in test mode</li>
        </ul>
      </div>
    </div>
  );
};

export default PaymentTest;
