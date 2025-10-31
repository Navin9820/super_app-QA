import React, { useState } from 'react';
import AppRoutes from './routes/index.jsx';
import { NotificationManager } from './components/Notification.jsx';
import { TransactionProvider, NotificationProvider } from './TransactionContext.jsx';

function App() {
  // Online status state for pilot
  const [isOnline, setIsOnline] = useState(false);
  const toggleOnline = () => setIsOnline((prev) => !prev);

  // Error boundary for context providers
  try {
    return (
      <NotificationProvider>
        <TransactionProvider>
          {/* Pass online status and toggle to AppRoutes */}
          <AppRoutes isOnline={isOnline} toggleOnline={toggleOnline} />
          <NotificationManager />
        </TransactionProvider>
      </NotificationProvider>
    );
  } catch (error) {
    console.error('Error initializing app:', error);
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>App Initialization Error</h2>
        <p>Please refresh the page to try again.</p>
        <button onClick={() => window.location.reload()}>
          Refresh Page
        </button>
      </div>
    );
  }
}

export default App; 