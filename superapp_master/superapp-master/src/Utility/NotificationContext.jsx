import React, { createContext, useContext, useState, useEffect } from 'react';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(notificationService.getNotifications());
  const [unreadCount, setUnreadCount] = useState(notificationService.getUnreadCount());

  useEffect(() => {
    // Subscribe to notification changes
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
      setUnreadCount(notificationService.getUnreadCount());
    });

    return unsubscribe;
  }, []);

  const addNotification = (notification) => {
    return notificationService.addNotification(notification);
  };

  const addOrderSuccessNotification = (orderData) => {
    return notificationService.addOrderSuccessNotification(orderData);
  };

  const addPaymentSuccessNotification = (paymentData) => {
    return notificationService.addPaymentSuccessNotification(paymentData);
  };

  const addOrderStatusNotification = (orderData) => {
    return notificationService.addOrderStatusNotification(orderData);
  };

  const markAsRead = (id) => {
    notificationService.markAsRead(id);
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const deleteNotification = (id) => {
    notificationService.deleteNotification(id);
  };

  const getGroupedNotifications = () => {
    return notificationService.getGroupedNotifications();
  };

  const clearAll = () => {
    notificationService.clearAll();
  };

  const value = {
    notifications,
    unreadCount,
    addNotification,
    addOrderSuccessNotification,
    addPaymentSuccessNotification,
    addOrderStatusNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getGroupedNotifications,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
