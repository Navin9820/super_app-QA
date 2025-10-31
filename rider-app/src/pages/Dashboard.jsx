import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HiArrowRight, 
  HiCurrencyRupee,
  HiStar,
  HiCheckCircle,
  HiOutlineStatusOnline,
  HiOutlineCollection,
  HiOutlineCash,
  HiOutlineUserCircle,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiRefresh
} from 'react-icons/hi';
import Header from '../components/Header.jsx';
import Map from '../components/Map.jsx';
import BottomNav from '../components/BottomNav.jsx';
import tripService from '../services/trips.jsx';
import earningsService from '../services/earnings.jsx';
import authService from '../services/auth.jsx';
import { riderAPI } from '../config/superAppApi';
import { useNotification } from '../TransactionContext';

// 🎯 SERVICE-BASED FILTERING: Filter orders based on rider's service type
const filterOrdersByServiceType = (orders, userModuleType) => {
  if (!orders || !Array.isArray(orders)) return [];
  
  console.log('🔍 Filtering orders for service type:', userModuleType);
  console.log('🔍 Total orders before filtering:', orders.length);
  
  let filteredOrders = [];
  
  switch (userModuleType) {
    case 'taxi':
      // Taxi drivers only see taxi ride requests
      filteredOrders = orders.filter(order => 
        order.type === 'taxi' || order.type === 'taxi_request' || order.order_type === 'taxi'
      );
      console.log('🚕 Taxi driver - showing only taxi orders:', filteredOrders.length);
      break;
      
    case 'porter':
      // Porter drivers only see porter delivery requests
      filteredOrders = orders.filter(order => 
        order.type === 'porter' || order.order_type === 'porter' ||
        order.type === 'porter_request' || order.order_type === 'porter_request'
      );
      console.log('📦 Porter driver - showing only porter orders:', filteredOrders.length);
      break;
      
    case 'rider':
    default:
      // General delivery riders see ecommerce, food (restaurant), and grocery orders
      filteredOrders = orders.filter(order => 
        order.type === 'ecommerce' || order.type === 'food' || order.type === 'grocery' ||
        order.order_type === 'ecommerce' || order.order_type === 'food' || order.order_type === 'grocery'
      );
      console.log('🚚 General rider - showing delivery orders:', filteredOrders.length);
      break;
  }
  
  return filteredOrders;
};

const Dashboard = React.memo(({ isOnline, toggleOnline }) => {
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const professionalType = localStorage.getItem('professionalType');
  const [userIsOnline, setUserIsOnline] = useState(false);
  const [tripStats, setTripStats] = useState(null);
  const [earningsStats, setEarningsStats] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recentCompletedTrip, setRecentCompletedTrip] = useState(null);
  const [recentRatingTrip, setRecentRatingTrip] = useState(null);
  const [recentPayment, setRecentPayment] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const refreshingRef = useRef(false);

  // 🚀 OPTIMIZED: Load dashboard data with immediate UI rendering
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // ✅ IMMEDIATE: Load user profile (instant - from localStorage)
      const user = authService.getCurrentUser();
      if (user) {
        setUserIsOnline(user.is_online || false);
      }

      // 🎯 SERVICE-BASED FILTERING: Get user's service type for order filtering
      const userModuleType = user?.module_type || localStorage.getItem('module_type') || 'rider';
      console.log('🔍 Dashboard - User service type:', userModuleType);

      // ✅ FAST: Set default stats immediately (show UI instantly)
      setTripStats({
        total: 0,
        completed: 0,
        active: 0,
        cancelled: 0,
        totalEarnings: 0,
        averageRating: 0,
        trips: [] // ✅ CRITICAL: Include trips array for memoized calculations
      });
      setEarningsStats({ total_earnings: 0 });
      setRecentPayment(null);

      // ✅ CRITICAL: Show UI immediately after basic data
      setIsLoading(false);

      // 🚀 PARALLEL: Load heavy data in background (non-blocking)
      const loadHeavyData = async () => {
        try {
          // Load stats and earnings in parallel
          const [stats, earnings, recentTransactions] = await Promise.all([
            tripService.getTripStats(),
            earningsService.getEarnings('all'),
            earningsService.getRecentTransactions(5)
          ]);

          // Update UI with real data (non-blocking)
          setTripStats(stats);
          setEarningsStats(earnings);
          setRecentPayment(recentTransactions[0] || null);
        } catch (error) {
          // Keep default values if stats fail
        }
      };

      // 🚀 PARALLEL: Load orders separately (heaviest operation)
      const loadOrders = async () => {
        setIsLoadingOrders(true);
        try {
          // 🎯 SERVICE-BASED FILTERING: Get orders filtered by user's service type
          const orders = await tripService.getAvailableOrders();
          
          // Filter orders based on user's service type
          const filteredOrders = filterOrdersByServiceType(orders, userModuleType);
          console.log(`🔍 Dashboard - Filtered orders for ${userModuleType}:`, filteredOrders.length, 'orders');
          
          setAvailableOrders(filteredOrders);
        } catch (error) {
          setAvailableOrders([]);
        } finally {
          setIsLoadingOrders(false);
        }
      };

      // Start both background operations
      loadHeavyData();
      loadOrders();

    } catch (error) {
      setIsLoading(false);
    }
  };

  // Memoized calculations for expensive operations
  const latestCompleted = useMemo(() => 
    tripStats?.trips?.find(trip => trip.status === 'completed'), [tripStats]
  );
  
  const latestRating = useMemo(() => 
    tripStats?.trips?.find(trip => trip.rating && trip.rating > 0), [tripStats]
  );

  // Update state when memoized values change
  useEffect(() => {
    setRecentCompletedTrip(latestCompleted || null);
    setRecentRatingTrip(latestRating || null);
  }, [latestCompleted, latestRating]);

  // Refresh dashboard data
  const refreshDashboard = useCallback(async () => {
    if (!refreshingRef.current) {
      refreshingRef.current = true;
      setIsRefreshing(true);
      
      // 🎯 SERVICE-BASED FILTERING: Refresh orders with service filtering
      try {
        const user = authService.getCurrentUser();
        const userModuleType = user?.module_type || localStorage.getItem('module_type') || 'rider';
        
        const orders = await tripService.getAvailableOrders();
        const filteredOrders = filterOrdersByServiceType(orders, userModuleType);
        setAvailableOrders(filteredOrders);
        
        console.log(`🔄 Refresh - Filtered orders for ${userModuleType}:`, filteredOrders.length, 'orders');
      } catch (error) {
        console.error('Error refreshing orders:', error);
        setAvailableOrders([]);
      }
      
      setIsRefreshing(false);
      refreshingRef.current = false;
    }
  }, []); // Use ref to prevent infinite loops

  // Handle online/offline toggle
  const handleOnlineToggle = async () => {
    try {
      const newStatus = !userIsOnline;
      setUserIsOnline(newStatus);
      
      // Update backend
      await riderAPI.toggleOnlineStatus(newStatus);
      
      // Update local user data
      const user = authService.getCurrentUser();
      if (user) {
        const updatedUser = { ...user, is_online: newStatus };
        setUserIsOnline(updatedUser.is_online);
        localStorage.setItem('rider-user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      // Revert on error
      setUserIsOnline(!userIsOnline);
    }
  };

  // Handle quick actions - MUST be before early return
  const handleQuickAction = useCallback((action) => {
    switch (action) {
      case 'go_online':
        toggleOnline();
        break;
      case 'view_trips':
        navigate('/trips');
        break;
      case 'view_earnings':
        navigate('/earnings');
        break;
      case 'view_profile':
        navigate('/profile');
        break;
      case 'view_analytics':
        navigate('/analytics');
        break;
      case 'view_available_orders':
        navigate('/available-orders');
        break;
      default:
        break;
    }
  }, [navigate, toggleOnline]);

  // Helper to format 'time ago' - MUST be before early return
  const timeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // ✅ CRITICAL: ALL HOOKS MUST BE BEFORE ANY CONDITIONAL LOGIC
  useEffect(() => {
    console.log('🔍 Dashboard useEffect - Checking authentication...');
    const isLoggedIn = authService.isLoggedIn();
    console.log('🔍 Dashboard useEffect - isLoggedIn result:', isLoggedIn);
    
    if (!isLoggedIn) {
      console.log('🔍 Dashboard useEffect - Not logged in, redirecting to login...');
      navigate('/');
      return;
    }
    
    console.log('🔍 Dashboard useEffect - User is logged in, loading dashboard data...');

    loadDashboardData();

    // Set up auto-refresh every 5 minutes (instead of 30 seconds)
    const refreshInterval = setInterval(refreshDashboard, 300000); // 5 minutes

    return () => {
      clearInterval(refreshInterval);
    };
  }, [navigate, refreshDashboard]);

  // ✅ EARLY RETURN AFTER ALL HOOKS
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>🔄</div>
          <div style={{ fontSize: 16, color: '#666' }}>Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header 
        title="Dashboard" 
        showBackButton={false}
        rightAction={
          <button 
            onClick={refreshDashboard}
            disabled={isRefreshing}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh dashboard"
            title="Refresh dashboard data"
          >
            <HiRefresh 
              className={`text-lg transition-transform duration-300 ${
                isRefreshing ? 'animate-spin' : 'hover:rotate-180'
              }`} 
            />
          </button>
        }
      />

      <div style={{ 
        padding: '16px', 
        paddingTop: '20px', // Reduced spacing between header and content
        paddingBottom: '96px', // Adjusted for BottomNav height (80px + 16px padding)
        minHeight: '100vh',
        boxSizing: 'border-box'
      }}>
        {/* Online Status Card */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
                {authService.getCurrentUser()?.name || 'Rider'}
              </div>
              <div style={{ fontSize: 14, color: '#666' }}>
                {authService.getCurrentUser()?.vehicle_type || 'Bike'} • {authService.getCurrentUser()?.vehicle_model || 'Vehicle'}
              </div>
            </div>
            {/* Online/Offline toggle hidden as requested */}
            <div style={{ display: 'none' }}>
              <HiOutlineStatusOnline />
              {userIsOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <StatCard 
            value={tripStats?.total || 0}
            label="Total Trips"
            icon={<HiOutlineCollection />}
          />
          <StatCard 
            value={earningsService.formatCurrency(earningsStats?.total_earnings || 0)}
            label="Total Earnings"
            icon={<HiCurrencyRupee />}
          />
          <StatCard 
            value={tripStats?.completed || 0}
            label="Completed"
            icon={<HiCheckCircle />}
          />
          <StatCard 
            value={tripStats?.averageRating || 0}
            label="Rating"
            icon={<HiStar />}
          />
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ActionButton
              onClick={() => handleQuickAction('view_trips')}
              icon={<HiOutlineCalendar />}
              label="My Trips"
              subtext="View trip history"
              color="blue"
            />
            <ActionButton
              onClick={() => handleQuickAction('view_earnings')}
              icon={<HiOutlineCash />}
              label="Earnings"
              subtext="Check your earnings"
              color="green"
            />
            <ActionButton
              onClick={() => handleQuickAction('view_profile')}
              icon={<HiOutlineUserCircle />}
              label="Profile"
              subtext="Update your profile"
              color="purple"
            />
            <ActionButton
              onClick={() => handleQuickAction('view_analytics')}
              icon={<HiOutlineChartBar />}
              label="Analytics"
              subtext="View performance"
              color="orange"
            />
          </div>
        </div>

        {/* Available Orders */}
        {isLoadingOrders ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
              Available Orders
            </div>
            <div style={{
              background: 'white',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              textAlign: 'center',
              color: '#666'
            }}>
              Loading available orders...
            </div>
          </div>
        ) : availableOrders.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
              Available Orders ({availableOrders.length})
            </div>
            {/* 🎯 SERVICE TYPE INDICATOR */}
            <div style={{ 
              fontSize: 12, 
              color: '#666', 
              marginBottom: 12,
              padding: '4px 8px',
              background: '#f0f9ff',
              borderRadius: '6px',
              border: '1px solid #e0f2fe'
            }}>
              {(() => {
                const user = authService.getCurrentUser();
                const userModuleType = user?.module_type || localStorage.getItem('module_type') || 'rider';
                switch (userModuleType) {
                  case 'taxi': return '🚕 Showing Taxi Ride Requests Only';
                  case 'porter': return '📦 Showing Porter Delivery Requests Only';
                  case 'rider':
                  default: return '🚚 Showing Ecommerce, Restaurant & Grocery Orders';
                }
              })()}
            </div>
            <div style={{
              background: 'white',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              {availableOrders.slice(0, 3).map((order, index) => (
                <div key={order.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: index < availableOrders.slice(0, 3).length - 1 ? '1px solid #f0f0f0' : 'none'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 'bold' }}>Delivery</span>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: (order.type === 'ecommerce' || order.order_type === 'ecommerce') ? '#2563eb' : '#059669',
                        background: (order.type === 'ecommerce' || order.order_type === 'ecommerce') ? 'rgba(37,99,235,0.08)' : 'rgba(5,150,105,0.08)',
                        border: '1px solid rgba(0,0,0,0.05)',
                        padding: '2px 6px',
                        borderRadius: 10,
                        textTransform: 'uppercase'
                      }}>
                        {(order.type || order.order_type || '').toString() || 'unknown'}
                      </span>
                    </div>
                    {/* Customer Info for Ecommerce Orders */}
                    {((order.type === 'ecommerce' || order.order_type === 'ecommerce') || (order.type === 'grocery' || order.order_type === 'grocery') || (order.type === 'food' || order.order_type === 'food') || (order.type === 'taxi' || order.order_type === 'taxi') || (order.type === 'porter' || order.order_type === 'porter')) && (order.customer || order.customer_phone) && (
                      <div style={{ fontSize: 11, color: '#4B5563', marginBottom: 4 }}>
                        {/* <div style={{ fontWeight: '500' }}>
                          {order.customer && `Customer: ${order.customer}`}
                        </div> */}
                        {order.customer_phone && (
                          <div style={{ fontSize: 10, color: '#6B7280' }}>
                            Phone: {order.customer_phone}
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {order.pickup} → {order.dropoff}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#10B981' }}>
                      ₹{order.fare}
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          // Determine order type for backend
                          const orderType = order.order_type || order.type || (order.pickup?.includes('Grocery') ? 'grocery' : 'ecommerce');
                          const backendOrderId = order.order_id || order.id; // prefer real backend ObjectId
                          
                          // 🚗 SPECIAL HANDLING FOR TAXI ORDERS
                          if (orderType === 'taxi' || orderType === 'taxi_request') {
                            // For taxi orders, navigate to AcceptRide page with ride details
                            const rideData = {
                              id: backendOrderId,
                              pickup: {
                                address: order.pickup,
                                coordinates: order.pickup_coordinates || null
                              },
                              dropoff: {
                                address: order.dropoff,
                                coordinates: order.dropoff_coordinates || null
                              },
                              fare: order.fare,
                              vehicleType: order.customer_vehicle_type || order.vehicle_type || order.vehicleType || order.vehicle || 'Car',
                              status: order.status || 'pending',
                              customer: order.customer_name || order.user?.name || 'Customer',
                              paymentMethod: order.payment_method || 'cash'
                            };
                            
                            navigate(`/accept-ride/${backendOrderId}`, {
                              state: { ride: rideData }
                            });
                            return;
                          }
                          
                          // 🚚 SPECIAL HANDLING FOR PORTER ORDERS
                          if (orderType === 'porter' || orderType === 'porter_request') {
                            // For porter orders, navigate to AcceptPorterRide page with delivery details
                            const deliveryData = {
                              id: backendOrderId,
                              pickup: order.pickup,
                              dropoff: order.dropoff,
                              fare: order.fare,
                              vehicleType: order.vehicle_type || 'Auto',
                              status: order.status || 'pending',
                              item_description: order.item_description || 'Delivery service',
                              special_instructions: order.special_instructions || null
                            };
                            
                            navigate(`/accept-porter/${backendOrderId}`, {
                              state: { rideData: deliveryData }
                            });
                            return;
                          }
                          
                          // For other order types, use existing logic
                          await riderAPI.acceptOrder(backendOrderId, { order_type: orderType });
                          navigate('/delivery-navigation-map', {
                            state: {
                              pickup: order.pickup,
                              dropoff: order.dropoff,
                              payment: order.fare,
                              orderId: backendOrderId,
                              paymentMethod: (orderType === 'ecommerce') ? 'cod' : '',
                              // ✅ FIXED: Pass orderType for proper backend sync
                              orderType: orderType,
                              // ✅ FIXED: Pass previousPage for smart back navigation
                              previousPage: 'dashboard'
                            }
                          });
                        } catch (err) {
                          console.error('Order acceptance failed:', err);
                          addNotification({
                            type: 'error',
                            title: 'Order Acceptance Failed',
                            message: 'Failed to accept order. Please try again.'
                          });
                        }
                      }}
                      style={{
                        background: '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
              {availableOrders.length > 3 && (
                <div style={{ textAlign: 'center', paddingTop: 12 }}>
                  <button
                    onClick={() => navigate('/available-orders')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3B82F6',
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    View All ({availableOrders.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Recent Activity</div>
          
          {recentCompletedTrip && (
            <ActivityCard
              icon={<HiCheckCircle />}
              title="Trip Completed"
              description={`${recentCompletedTrip.pickup} → ${recentCompletedTrip.dropoff}`}
              meta={`₹${recentCompletedTrip.fare}`}
              time={timeAgo(recentCompletedTrip.endTime)}
              color="green"
            />
          )}
          
          {recentRatingTrip && (
            <ActivityCard
              icon={<HiStar />}
              title="New Rating"
              description={`${recentRatingTrip.customer} rated your service`}
              meta={`${recentRatingTrip.rating}⭐`}
              time={timeAgo(recentRatingTrip.endTime)}
              color="yellow"
            />
          )}
          
          {recentPayment && (
            <ActivityCard
              icon={<HiCurrencyRupee />}
              title="Payment Received"
              description={recentPayment.description}
              meta={earningsService.formatCurrency(recentPayment.amount)}
              time={timeAgo(recentPayment.date)}
              color="blue"
            />
          )}
          
          {!recentCompletedTrip && !recentRatingTrip && !recentPayment && (
            <div style={{
              background: 'white',
              borderRadius: 12,
              padding: 20,
              textAlign: 'center',
              color: '#666'
            }}>
              No recent activity
            </div>
          )}
        </div>

        {/* Map Toggle */}
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setShowMap(!showMap)}
            style={{
              width: '100%',
              background: 'white',
              border: '2px solid #e0e0e0',
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {showMap ? 'Hide Map' : 'Show Map'}
            <HiArrowRight style={{ transform: showMap ? 'rotate(180deg)' : 'none' }} />
          </button>
        </div>

        {showMap && (
          <div style={{ marginBottom: 16 }}>
            <Map />
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
});

// Stat Card Component
const StatCard = ({ value, label, icon }) => (
  <div style={{
    background: 'white',
    borderRadius: 12,
    padding: 16,
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  }}>
    <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
    <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>{value}</div>
    <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
  </div>
);

// Action Button Component
const ActionButton = ({ onClick, icon, label, subtext, color, variant = 'solid' }) => (
  <button
    onClick={onClick}
    style={{
      background: variant === 'solid' ? color : 'white',
      color: variant === 'solid' ? 'white' : color,
      border: variant === 'outline' ? `2px solid ${color}` : 'none',
      borderRadius: 12,
      padding: 16,
      cursor: 'pointer',
      textAlign: 'left',
      width: '100%'
    }}
  >
    <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
    <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 12, opacity: 0.8 }}>{subtext}</div>
  </button>
);

// Activity Card Component
const ActivityCard = ({ icon, title, description, meta, time, color = 'blue' }) => (
  <div style={{
    background: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: 12
  }}>
    <div style={{
      width: 40,
      height: 40,
      borderRadius: '50%',
      background: color,
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 18
    }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{description}</div>
      <div style={{ fontSize: 11, color: '#999' }}>{time}</div>
    </div>
    <div style={{ fontSize: 14, fontWeight: 'bold', color: color }}>{meta}</div>
  </div>
);

export default Dashboard;