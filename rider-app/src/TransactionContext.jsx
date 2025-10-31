import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import earningsService from './services/earnings.jsx';

const TransactionContext = createContext();
const EarningsContext = createContext();
const NotificationContext = createContext();

const getInitialNotifications = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('notifications');
      if (stored) return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load notifications from localStorage:', error);
  }
  return [];
};

export const TransactionProvider = ({ children }) => {
  // Centralized transaction state
  const [transactions, setTransactions] = useState([]);
  const [earnings, setEarnings] = useState(null);

  useEffect(() => {
    // Load initial data from service only if user is logged in
    const loadData = async () => {
      try {
        // Check if user is logged in
        const token = localStorage.getItem('rider-token');
        if (!token) {
          return;
        }

        // Add a small delay to ensure all contexts are properly initialized
        await new Promise(resolve => setTimeout(resolve, 100));

        const [transactionsData, earningsData] = await Promise.all([
          earningsService.getRecentTransactions(500),
          earningsService.getEarningsSummary()
        ]);
        setTransactions(transactionsData);
        setEarnings(earningsData);
      } catch (error) {
        console.warn('Failed to load initial data:', error);
        setTransactions([]);
        setEarnings(null);
      }
    };

    loadData();
    
    // Listen for dashboard data changes
    const reload = () => {
      loadData();
    };
    window.addEventListener('dashboardDataChanged', reload);
    return () => window.removeEventListener('dashboardDataChanged', reload);
  }, []);

  // Add a new transaction (e.g., withdrawal)
  const addTransaction = (tx) => {
    setTransactions(prev => [tx, ...prev]);
  };

  // Update a transaction by id
  const updateTransaction = (id, updates) => {
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx));
  };

  // Update earnings after withdrawal
  const updateEarnings = (period, amount) => {
    setEarnings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [period]: {
          ...prev[period],
          earnings: (prev[period]?.earnings || 0) - amount
        }
      };
    });
  };

  // Calculate balance from transactions
  const balance = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  // Always provide balance in the earnings context
  const earningsWithBalance = earnings ? { ...earnings, balance } : { balance: 0 };

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, updateTransaction }}>
      <EarningsContext.Provider value={{ earnings: earningsWithBalance, setEarnings, updateEarnings }}>
        {children}
      </EarningsContext.Provider>
    </TransactionContext.Provider>
  );
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Initialize notifications from localStorage
  useEffect(() => {
    try {
      const initialNotifications = getInitialNotifications();
      setNotifications(initialNotifications);
    } catch (error) {
      console.warn('Failed to initialize notifications:', error);
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('notifications', JSON.stringify(notifications));
      }
    } catch (error) {
      console.warn('Failed to save notifications to localStorage:', error);
    }
  }, [notifications]);

  const addNotification = useCallback((notification) => {
    try {
      const newNotification = {
        id: Date.now(),
        type: notification.type || 'info',
        title: notification.title || 'Notification',
        message: notification.message || '',
        time: notification.time || new Date().toLocaleTimeString(),
        read: false,
        ...notification
      };
      setNotifications(prev => [newNotification, ...prev]);
      // Show toast if NotificationManager is present (with safety check)
      if (typeof window !== 'undefined' && window.showNotification) {
        window.showNotification(newNotification.title + ': ' + newNotification.message, newNotification.type);
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  }, []);

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const deleteAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    console.warn('useTransactions must be used within a TransactionProvider');
    return { transactions: [], addTransaction: () => {}, updateTransaction: () => {} };
  }
  return context;
}; 

export const useEarnings = () => {
  const context = useContext(EarningsContext);
  if (!context) {
    console.warn('useEarnings must be used within a TransactionProvider');
    return { earnings: { balance: 0 }, setEarnings: () => {}, updateEarnings: () => {} };
  }
  return context;
}; 

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    console.warn('useNotification must be used within a NotificationProvider');
    return { 
      notifications: [], 
      addNotification: () => {}, 
      markAsRead: () => {}, 
      markAllAsRead: () => {}, 
      deleteNotification: () => {}, 
      deleteAllNotifications: () => {} 
    };
  }
  return context;
}; 