import React, { useState } from 'react';
import { useNotification } from '../TransactionContext';
import { useNavigate } from 'react-router-dom';

const typeIcons = {
  trip: '🛺',
  payment: '💸',
  system: '🔔',
  info: 'ℹ️',
  warning: '⚠️',
  error: '❌',
  success: '✅'
};

const NotificationModal = ({ notification, onClose }) => {
  if (!notification) return null;
  return (
    <div className="fixed inset-0 w-screen h-screen bg-black bg-opacity-25 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl p-7 min-w-[280px] max-w-[90vw] text-center shadow-2xl">
        <div className="text-4xl mb-2.5">{typeIcons[notification.type] || '🔔'}</div>
        <div className="font-bold text-lg mb-2">{notification.title}</div>
        <div className="text-[15px] text-gray-700 mb-3">{notification.message}</div>
        <div className="text-xs text-gray-400 mb-4.5">{notification.time}</div>
        <button className="bg-blue-700 text-white border-none rounded px-6 py-2.5 font-semibold text-base cursor-pointer" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

const NotificationCenter = () => {
  const { notifications, markAllAsRead, markAsRead, deleteNotification, deleteAllNotifications } = useNotification();
  const [modalNotification, setModalNotification] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const navigate = useNavigate();

  const handleNotificationClick = (n) => {
    if (!n.read) markAsRead(n.id);
    setModalNotification(n);
  };

  const handleDeleteClick = (e, notification) => {
    e.stopPropagation();
    setNotificationToDelete(notification);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (notificationToDelete) {
      deleteNotification(notificationToDelete.id);
    }
    setShowDeleteConfirm(false);
    setNotificationToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setNotificationToDelete(null);
  };

  const handleDeleteAll = () => {
    setNotificationToDelete('all');
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAll = () => {
    deleteAllNotifications();
    setShowDeleteConfirm(false);
    setNotificationToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-100 to-indigo-200 dark:from-gray-900 dark:to-gray-900 pb-0">
      {/* Sticky App Bar/Header */}
      <header className="sticky top-0 z-[100] bg-gradient-to-tr from-indigo-500 to-blue-700 dark:from-gray-900 dark:to-blue-900 text-white shadow-md mb-4.5">
        <div className="relative flex items-center justify-center h-16">
          <button
            onClick={() => navigate('/dashboard')}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-none border-none text-white text-2xl cursor-pointer p-0 m-0"
            aria-label="Back to dashboard"
            style={{ lineHeight: 1 }}
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔔</span>
            <span className="font-bold text-xl tracking-wide">Notification Center</span>
          </div>
        </div>
      </header>
      <div className="max-w-[480px] mx-auto pb-8">
        <div className="flex items-center justify-between mt-4 mb-2 px-1">
          <button
            className="bg-red-600 text-white border-none rounded px-3 py-1 text-xs font-semibold shadow-sm hover:bg-red-700 transition-all"
            style={{ minWidth: 'auto', fontSize: '13px', height: '28px' }}
            onClick={handleDeleteAll}
            disabled={notifications.length === 0}
          >
            Delete All
          </button>
          <button
            className="bg-blue-700 text-white border-none rounded px-3 py-1 text-xs font-semibold shadow-sm hover:bg-blue-800 transition-all"
            style={{ minWidth: 'auto', fontSize: '13px', height: '28px' }}
            onClick={markAllAsRead}
            disabled={notifications.length === 0}
          >
            Mark all as read
          </button>
        </div>
        <div className="flex flex-col gap-3 px-1">
          {notifications.length === 0 ? (
            <div className="text-gray-400 text-center mt-10">No notifications yet.</div>
          ) : notifications.map(n => (
            <div
              key={n.id}
              className={`flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-3 shadow transition-all border-l-4 ${n.read ? 'border-gray-300 opacity-70 shadow-sm' : 'border-blue-700 shadow-lg'}`}
            >
              <span className="text-xl flex-shrink-0">{typeIcons[n.type] || '🔔'}</span>
              <div 
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => handleNotificationClick(n)}
              >
                <div className={n.read ? 'font-normal text-[15px] dark:text-gray-300 truncate' : 'font-bold text-[15px] dark:text-gray-100 truncate'}>{n.title}</div>
                <div className="text-[13px] text-gray-700 dark:text-gray-300 mt-0.5 truncate">{n.message}</div>
                <div className="text-[11px] text-gray-400 mt-1">{n.time}</div>
              </div>
              <div className="flex items-center gap-2">
                {!n.read && <span className="w-2 h-2 rounded-full bg-blue-700 inline-block"></span>}
                <button
                  onClick={(e) => handleDeleteClick(e, n)}
                  className="text-red-500 hover:text-red-700 text-lg p-1 rounded-full hover:bg-red-50 transition-all"
                  title="Delete notification"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
        <NotificationModal notification={modalNotification} onClose={() => setModalNotification(null)} />
        
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 w-screen h-screen bg-black bg-opacity-25 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-xl p-7 min-w-[280px] max-w-[90vw] text-center shadow-2xl">
              <div className="text-4xl mb-2.5">🗑️</div>
              <div className="font-bold text-lg mb-2">
                {notificationToDelete === 'all' ? 'Delete All Notifications?' : 'Delete Notification?'}
              </div>
              <div className="text-[15px] text-gray-700 mb-3">
                {notificationToDelete === 'all' 
                  ? 'This will permanently delete all notifications. This action cannot be undone.'
                  : 'This notification will be permanently deleted. This action cannot be undone.'
                }
              </div>
              <div className="flex gap-3 justify-center">
                <button 
                  className="bg-gray-500 text-white border-none rounded px-6 py-2.5 font-semibold text-base cursor-pointer hover:bg-gray-600 transition-all"
                  onClick={cancelDelete}
                >
                  Cancel
                </button>
                <button 
                  className="bg-red-600 text-white border-none rounded px-6 py-2.5 font-semibold text-base cursor-pointer hover:bg-red-700 transition-all"
                  onClick={notificationToDelete === 'all' ? confirmDeleteAll : confirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter; 