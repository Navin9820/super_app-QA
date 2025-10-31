import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiMapPin, HiUser, HiPhone, HiCurrencyRupee } from 'react-icons/hi';
import { riderAPI } from '../config/superAppApi';
import BottomNav from '../components/BottomNav';

const AvailableOrders = () => {
  const navigate = useNavigate();
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAvailableOrders();
  }, []);

  const fetchAvailableOrders = async () => {
    try {
      setLoading(true);
      const response = await riderAPI.getAvailableOrders();
      if (response.success) {
        setAvailableOrders(response.data);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err) {
      setError('Error fetching orders');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId, orderType) => {
    try {
      const response = await riderAPI.acceptOrder(orderId, orderType);
      if (response.success) {
        // Remove the accepted order from the list
        setAvailableOrders(prev => prev.filter(order => order.id !== orderId));
        
        // Get the order details for navigation
        const order = availableOrders.find(o => o.id === orderId);
        
        // Handle taxi and porter rides differently
        if (orderType === 'taxi' || orderType === 'taxi_request' || orderType === 'porter' || orderType === 'porter_request') {
          console.log('🚗 Accepting taxi/porter ride:', { orderId, orderType, order });
          
          // Navigate to taxi ride management
          navigate('/taxi-ride-management', {
            state: {
              rideId: orderId,
              rideType: orderType,
              pickup: order?.pickup || 'Pickup Location',
              dropoff: order?.dropoff || 'Dropoff Location',
              pickupCoords: order?.pickup_coords || [13.0827, 80.2707], // Default to Chennai
              dropoffCoords: order?.dropoff_coords || [13.0418, 80.2337], // Default to T Nagar
              fare: order?.fare || 0,
              customerName: order?.customer || 'Customer',
              customerPhone: order?.customer_phone || '',
              item_description: order?.item_description || `${orderType} ride`,
              special_instructions: order?.special_instructions || ''
            }
          });
        } else {
          // Navigate to delivery navigation for other order types
          navigate('/delivery-navigation-map', {
            state: {
              pickup: order?.pickup,
              dropoff: order?.dropoff,
              payment: order?.fare,
              orderId: orderId,
              paymentMethod: (orderType === 'ecommerce') ? 'cod' : '',
              orderType: orderType,
              // ✅ FIXED: Pass previousPage for smart back navigation
              previousPage: 'available-orders'
            }
          });
        }
      } else {
        alert('Failed to accept order: ' + response.message);
      }
    } catch (err) {
      alert('Error accepting order: ' + err.message);
      console.error('Error:', err);
    }
  };

  const getOrderTypeColor = (type) => {
    switch (type) {
      case 'ecommerce': return '#3B82F6';
      case 'food': return '#EF4444';
      case 'grocery': return '#10B981';
      case 'taxi': return '#F59E0B';
      case 'taxi_request': return '#F59E0B';
      case 'porter': return '#8B5CF6';
      case 'porter_request': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getOrderTypeLabel = (type) => {
    switch (type) {
      case 'ecommerce': return 'E-COMMERCE';
      case 'food': return 'FOOD';
      case 'grocery': return 'GROCERY';
      case 'taxi': return 'TAXI';
      case 'taxi_request': return 'TAXI';
      case 'porter': return 'PORTER';
      case 'porter_request': return 'PORTER';
      default: return type.toUpperCase();
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#F3F4F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40,
            height: 40,
            border: '4px solid #E5E7EB',
            borderTop: '4px solid #3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6B7280' }}>Loading available orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#F3F4F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#EF4444', marginBottom: 16 }}>{error}</p>
          <button
            onClick={fetchAvailableOrders}
            style={{
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#F3F4F6',
      paddingBottom: 80
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '16px 20px',
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#374151'
            }}
          >
            <HiArrowLeft />
          </button>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 'bold',
              color: '#111827'
            }}>
              Available Orders
            </h1>
            <p style={{
              margin: 0,
              fontSize: 14,
              color: '#6B7280'
            }}>
              {availableOrders.length} orders available
            </p>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div style={{ padding: 16 }}>
        {availableOrders.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 40,
            textAlign: 'center',
            color: '#6B7280'
          }}>
            <p style={{ margin: 0, fontSize: 16 }}>No orders available at the moment</p>
            <p style={{ margin: '8px 0 0 0', fontSize: 14 }}>Check back later for new orders</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {availableOrders.map((order) => (
              <div
                key={order.id}
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 20,
                  border: '1px solid #E5E7EB'
                }}
              >
                {/* Order Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16
                }}>
                  <div style={{
                    background: getOrderTypeColor(order.type),
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}>
                    {getOrderTypeLabel(order.type)}
                  </div>
                  <div style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#10B981'
                  }}>
                    ₹{order.fare}
                  </div>
                </div>

                {/* Pickup & Dropoff */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    marginBottom: 12
                  }}>
                    <div style={{
                      background: '#10B981',
                      color: 'white',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      P
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        margin: '0 0 4px 0',
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#111827'
                      }}>
                        Pickup
                      </p>
                      <p style={{
                        margin: 0,
                        fontSize: 13,
                        color: '#6B7280',
                        lineHeight: 1.4
                      }}>
                        {order.pickup}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12
                  }}>
                    <div style={{
                      background: '#EF4444',
                      color: 'white',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      D
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        margin: '0 0 4px 0',
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#111827'
                      }}>
                        Dropoff
                      </p>
                      {/* Customer Info for Ecommerce Orders */}
                      {((order.type === 'ecommerce' || order.order_type === 'ecommerce') || (order.type === 'grocery' || order.order_type === 'grocery') || (order.type === 'food' || order.order_type === 'food') || (order.type === 'taxi' || order.order_type === 'taxi') || (order.type === 'porter' || order.order_type === 'porter')) && (order.customer || order.customer_phone) && (
                        <div style={{
                          margin: '0 0 8px 0',
                          padding: '8px 12px',
                          background: '#F3F4F6',
                          borderRadius: '6px',
                          border: '1px solid #E5E7EB'
                        }}>
                          <div style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '2px'
                          }}>
                            {order.customer && `Customer: ${order.customer}`}
                          </div>
                          {order.customer_phone && (
                            <div style={{
                              fontSize: 11,
                              color: '#6B7280'
                            }}>
                              Phone: {order.customer_phone}
                            </div>
                          )}
                        </div>
                      )}
                      <p style={{
                        margin: 0,
                        fontSize: 13,
                        color: '#6B7280',
                        lineHeight: 1.4
                      }}>
                        {order.dropoff}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                  padding: '12px 16px',
                  background: '#F9FAFB',
                  borderRadius: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <HiUser style={{ color: '#6B7280' }} />
                    <span style={{ fontSize: 13, color: '#6B7280' }}>
                      {order.customer || 'Customer'}
                    </span>
                  </div>
                  {order.customer_phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <HiPhone style={{ color: '#6B7280' }} />
                      <span style={{ fontSize: 13, color: '#6B7280' }}>
                        {order.customer_phone}
                      </span>
                    </div>
                  )}
                </div>

                {/* Accept Button */}
                <button
                  onClick={() => handleAcceptOrder(order.id, order.type)}
                  style={{
                    width: '100%',
                    background: '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '14px',
                    fontSize: 16,
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#059669'}
                  onMouseOut={(e) => e.target.style.background = '#10B981'}
                >
                  Accept Order
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AvailableOrders;
