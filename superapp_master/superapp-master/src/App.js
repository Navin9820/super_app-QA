import React from 'react';
import Navbar from './Utility/Navbar';
import { CartProvider } from './Utility/CartContext'; 
import { NotificationProvider } from './Utility/NotificationContext';

function App() {
  return (
    <div className="font-sans">
      <NotificationProvider>
        <CartProvider><Navbar/></CartProvider>
      </NotificationProvider>
    </div>
  );
}

export default App;
