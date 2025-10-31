import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlineArrowLeft, 
  HiOutlineBell, 
  HiOutlineTrash, 
  HiOutlineCheck, 
  HiOutlineDotsVertical,
  HiOutlineShoppingBag,
  HiOutlineTruck,
  HiOutlineCreditCard,
  HiOutlineGift,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineStar
} from 'react-icons/hi';
import Footer from '../Utility/Footer';
import { useNotifications } from '../Utility/NotificationContext';

const Notifications = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    getGroupedNotifications 
  } = useNotifications();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Get grouped notifications
  const groupedNotifications = getGroupedNotifications();

  // Get notification icon based on type
  const getNotificationIcon = (type, priority) => {
    const iconClass = `w-5 h-5 ${
      priority === 'high' ? 'text-red-600' : 
      priority === 'medium' ? 'text-orange-600' : 'text-gray-600'
    }`;
    
    switch (type) {
      case 'order_success':
        return <HiOutlineCheckCircle className={iconClass} />;
      case 'payment_success':
        return <HiOutlineCreditCard className={iconClass} />;
      case 'order_update':
        return <HiOutlineTruck className={iconClass} />;
      case 'delivery':
        return <HiOutlineTruck className={iconClass} />;
      case 'payment':
        return <HiOutlineCreditCard className={iconClass} />;
      case 'promotion':
        return <HiOutlineGift className={iconClass} />;
      case 'shipping':
        return <HiOutlineTruck className={iconClass} />;
      case 'feature':
        return <HiOutlineStar className={iconClass} />;
      case 'loyalty':
        return <HiOutlineGift className={iconClass} />;
      case 'recommendation':
        return <HiOutlineShoppingBag className={iconClass} />;
      default:
        return <HiOutlineBell className={iconClass} />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50/30';
      case 'medium':
        return 'border-orange-200 bg-orange-50/30';
      default:
        return 'border-gray-200 bg-gray-50/30';
    }
  };

  // Group notifications by date
  const groupNotificationsByDate = (notifications) => {
    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    notifications.forEach(notification => {
      const time = notification.time;
      if (time.includes('minute') || time.includes('hour')) {
        groups.today.push(notification);
      } else if (time.includes('day ago') && parseInt(time) === 1) {
        groups.yesterday.push(notification);
      } else if (time.includes('day ago') && parseInt(time) <= 7) {
        groups.thisWeek.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  };


  // Notification Card Component
  const NotificationCard = ({ notification, onMarkAsRead, onDelete, getIcon, getPriorityColor }) => {
    const moduleColors = notification.colors || {
      primary: '#6B7280',
      secondary: '#F3F4F6',
      icon: '🔔'
    };
    
    return (
      <div
        className={`bg-white rounded-xl p-4 shadow-sm border transition-all duration-200 hover:shadow-md ${
          notification.isRead 
            ? 'border-gray-100 opacity-75' 
            : getPriorityColor(notification.priority)
        }`}
        style={{
          borderLeftColor: notification.isRead ? '#E5E7EB' : moduleColors.primary,
          borderLeftWidth: '4px'
        }}
      >
        <div className="flex items-start gap-3">
          <div 
            className="p-2 rounded-full"
            style={{
              backgroundColor: notification.isRead ? '#F3F4F6' : moduleColors.secondary
            }}
          >
            <span className="text-lg">{moduleColors.icon}</span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 
                    className="font-semibold"
                    style={{
                      color: notification.isRead ? '#6B7280' : moduleColors.primary
                    }}
                  >
                    {notification.title}
                  </h3>
                  {notification.actionRequired && !notification.isRead && (
                    <span 
                      className="px-2 py-0.5 text-xs rounded-full font-medium"
                      style={{
                        backgroundColor: moduleColors.secondary,
                        color: moduleColors.primary
                      }}
                    >
                      Action Required
                    </span>
                  )}
                </div>
                <p className={`text-sm leading-relaxed mb-2 ${
                  notification.isRead ? 'text-gray-500' : 'text-gray-600'
                }`}>
                  {notification.message}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {notification.time}
                  </span>
                  {notification.orderId && (
                    <span className="text-xs text-blue-600 font-medium">
                      {notification.orderId}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-1 ml-2">
                {!notification.isRead && (
                  <button
                    onClick={() => onMarkAsRead(notification.id)}
                    className="p-1.5 rounded-full hover:bg-green-100 text-green-600 hover:text-green-700 transition-colors"
                    title="Mark as read"
                  >
                    <HiOutlineCheck className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={() => onDelete(notification.id)}
                  className="p-1.5 rounded-full hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors"
                  title="Delete notification"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/home')}
              className="p-2 rounded-full bg-purple-100 hover:bg-purple-200 transition-colors"
            >
              <HiOutlineArrowLeft className="w-5 h-5 text-purple-600" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <HiOutlineBell className="w-6 h-6 text-purple-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <h1 className="text-lg font-bold text-gray-800">Notifications</h1>
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium px-2 py-1 rounded-md hover:bg-purple-50 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        {notifications.length > 0 ? (
          <div className="space-y-6">
            {/* Today's Notifications */}
            {groupedNotifications.today.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3 px-2">Today</h2>
                <div className="space-y-3">
                  {groupedNotifications.today.map((notification) => (
                    <NotificationCard 
                      key={notification.id} 
                      notification={notification} 
                      onMarkAsRead={markAsRead}
                      onDelete={setShowDeleteConfirm}
                      getIcon={getNotificationIcon}
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Yesterday's Notifications */}
            {groupedNotifications.yesterday.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3 px-2">Yesterday</h2>
                <div className="space-y-3">
                  {groupedNotifications.yesterday.map((notification) => (
                    <NotificationCard 
                      key={notification.id} 
                      notification={notification} 
                      onMarkAsRead={markAsRead}
                      onDelete={setShowDeleteConfirm}
                      getIcon={getNotificationIcon}
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* This Week's Notifications */}
            {groupedNotifications.thisWeek.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3 px-2">This Week</h2>
                <div className="space-y-3">
                  {groupedNotifications.thisWeek.map((notification) => (
                    <NotificationCard 
                      key={notification.id} 
                      notification={notification} 
                      onMarkAsRead={markAsRead}
                      onDelete={setShowDeleteConfirm}
                      getIcon={getNotificationIcon}
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Older Notifications */}
            {groupedNotifications.older.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3 px-2">Older</h2>
                <div className="space-y-3">
                  {groupedNotifications.older.map((notification) => (
                    <NotificationCard 
                      key={notification.id} 
                      notification={notification} 
                      onMarkAsRead={markAsRead}
                      onDelete={setShowDeleteConfirm}
                      getIcon={getNotificationIcon}
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <HiOutlineBell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No notifications</h3>
            <p className="text-gray-500 text-sm">
              You're all caught up! New notifications will appear here.
            </p>
          </div>
        )}
      </main>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <HiOutlineTrash className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Notification</h3>
              <p className="text-gray-600 text-sm mb-6">
                Are you sure you want to delete this notification? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteNotification(showDeleteConfirm);
                    setShowDeleteConfirm(null);
                  }}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default Notifications;
