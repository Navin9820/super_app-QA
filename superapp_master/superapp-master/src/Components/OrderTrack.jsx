import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_CONFIG from '../config/api.config';
import { getOtpCode, hasOtp } from '../utils/otpUtils';

const OrderTrack = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [codOtpData, setCodOtpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const token = localStorage.getItem('token') || 'demo-token';
        
        // Fetch order
        const orderResponse = await fetch(API_CONFIG.getUrl(`${API_CONFIG.ENDPOINTS.ORDERS}/${orderId}`), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          if (orderData.success) {
            setOrder(orderData.data);
            
            // Fetch assignment details if order is confirmed/shipped
            if (['confirmed', 'shipped', 'delivered'].includes(orderData.data.status)) {
              try {
                const assignmentResponse = await fetch(API_CONFIG.getUrl(API_CONFIG.ORDERS.ASSIGNMENT(orderId)), {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (assignmentResponse.ok) {
                  const assignmentData = await assignmentResponse.json();
                  if (assignmentData.success) {
                    setAssignment(assignmentData.data);
                  }
                }
              } catch (err) {
                console.log('Assignment not found or not assigned yet');
              }
            }
            
            // Fetch COD OTP if applicable
            if (orderData.data.payment_method === 'cod' && ['shipped', 'delivered'].includes(orderData.data.status)) {
              try {
                const codResponse = await fetch(API_CONFIG.getUrl(API_CONFIG.ORDERS.COD_OTP(orderId)), {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (codResponse.ok) {
                  const codData = await codResponse.json();
                  if (codData.success) {
                    setCodOtpData(codData.data);
                  }
                }
              } catch (err) {
                console.log('COD OTP not available');
              }
            }
          }
        } else {
          setError('Order not found');
        }
      } catch (err) {
        setError('Failed to load order details');
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  // Simulate rider location updates (in real app, this would be via WebSocket)
  useEffect(() => {
    if (assignment && order?.status === 'shipped') {
      const simulateRiderLocation = () => {
        // Simulate rider moving between pickup and delivery locations
        const pickupLat = 13.024;
        const pickupLng = 80.176;
        const deliveryLat = parseFloat(order.shipping_address?.latitude || 13.014);
        const deliveryLng = parseFloat(order.shipping_address?.longitude || 80.186);
        
        // Simple interpolation for demo
        const progress = Math.random();
        const currentLat = pickupLat + (deliveryLat - pickupLat) * progress;
        const currentLng = pickupLng + (deliveryLng - pickupLng) * progress;
        
        setRiderLocation({ lat: currentLat, lng: currentLng });
      };
      
      simulateRiderLocation();
      const interval = setInterval(simulateRiderLocation, 5000); // Update every 5 seconds (fast like other orders)
      
      return () => clearInterval(interval);
    }
  }, [assignment, order]);

  const handleResendOtp = async () => {
    try {
      const token = localStorage.getItem('token') || 'demo-token';
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ORDERS.COD_OTP_RESEND(orderId)), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('OTP resent successfully');
        // Refresh COD OTP data
        window.location.reload();
      } else {
        alert('Failed to resend OTP');
      }
    } catch (err) {
      alert('Error resending OTP');
    }
  };

  const getOrderStatusDisplay = (status) => {
    const statusMap = {
      'pending': { text: 'Order Pending', color: '#f59e0b', icon: '⏳' },
      'confirmed': { text: 'Order Confirmed', color: '#10b981', icon: '✅' },
      'processing': { text: 'Preparing Order', color: '#3b82f6', icon: '📦' },
      'shipped': { text: 'Out for Delivery', color: '#8b5cf6', icon: '🚚' },
      'delivered': { text: 'Delivered', color: '#10b981', icon: '✅' },
      'cancelled': { text: 'Cancelled', color: '#ef4444', icon: '❌' }
    };
    
    return statusMap[status] || { text: status, color: '#6b7280', icon: '📋' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <button 
            onClick={() => navigate('/home-clothes/order-list')}
            className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Order not found</p>
      </div>
    );
  }

  const statusInfo = getOrderStatusDisplay(order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            ←
          </button>
          <h1 className="text-lg font-semibold">Track Order</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Order Status */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
              style={{ backgroundColor: statusInfo.color }}
            >
              {statusInfo.icon}
            </div>
            <div>
              <h2 className="font-semibold text-lg">{statusInfo.text}</h2>
              <p className="text-gray-600 text-sm">Order #{order.order_number}</p>
            </div>
          </div>
        </div>

        {/* Rider Info */}
        {assignment && (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold mb-3">Delivery Partner</h3>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                👤
              </div>
              <div>
                <p className="font-medium">{assignment.rider?.name || 'Delivery Partner'}</p>
                <p className="text-gray-600 text-sm">{assignment.rider?.phone || 'Contact via app'}</p>
              </div>
            </div>
            
            {riderLocation && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  📍 Current Location: {riderLocation.lat.toFixed(4)}, {riderLocation.lng.toFixed(4)}
                </p>
                <p className="text-xs text-blue-600 mt-1">Location updates every 10 seconds</p>
              </div>
            )}
          </div>
        )}

        {/* COD OTP */}
        {order.payment_method === 'cod' && order.status === 'shipped' && (codOtpData || hasOtp(order)) && (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold mb-3 flex items-center">
              💰 Cash on Delivery
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount to Pay:</span>
                <span className="font-semibold">₹{order.total_amount}</span>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 mb-2">
                  <strong>Delivery OTP:</strong>
                </p>
                <div className="text-2xl font-bold text-green-800 text-center py-2">
                  {codOtpData?.otp || getOtpCode(order)}
                </div>
                <p className="text-xs text-green-600 text-center">
                  Share this OTP with delivery partner to confirm payment
                </p>
              </div>
              
              {codOtpData?.expiresAt && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Expires:</span>
                  <span>{new Date(codOtpData.expiresAt).toLocaleTimeString()}</span>
                </div>
              )}
              
              {codOtpData && (
                <button 
                  onClick={handleResendOtp}
                  className="w-full bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold mb-3">Order Details</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium uppercase">{order.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold">₹{order.total_amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order Date:</span>
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          {order.shipping_address && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium mb-2">Delivery Address</h4>
              <p className="text-sm text-gray-600">
                {order.shipping_address.address_line1}
                {order.shipping_address.address_line2 && `, ${order.shipping_address.address_line2}`}
                <br />
                {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}
              </p>
            </div>
          )}
        </div>

        {/* Progress Timeline */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold mb-4">Order Progress</h3>
          
          <div className="space-y-4">
            {[
              { status: 'confirmed', title: 'Order Confirmed', desc: 'Your order has been confirmed' },
              { status: 'processing', title: 'Preparing', desc: 'Order is being prepared' },
              { status: 'shipped', title: 'Out for Delivery', desc: 'Delivery partner is on the way' },
              { status: 'delivered', title: 'Delivered', desc: 'Order has been delivered' }
            ].map((step, index) => {
              const isCompleted = ['confirmed', 'processing', 'shipped', 'delivered'].indexOf(order.status) >= index;
              const isCurrent = ['confirmed', 'processing', 'shipped', 'delivered'][index] === order.status;
              
              return (
                <div key={step.status} className="flex items-start space-x-3">
                  <div className={`w-4 h-4 rounded-full mt-1 ${
                    isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1">
                    <p className={`font-medium ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.title}
                    </p>
                    <p className={`text-sm ${isCompleted || isCurrent ? 'text-gray-600' : 'text-gray-400'}`}>
                      {step.desc}
                    </p>
                  </div>
                  {isCurrent && (
                    <div className="text-blue-500 text-sm font-medium">Current</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrack;