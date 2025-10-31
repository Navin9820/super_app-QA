import React, { useState } from 'react';
import GroceryOrderTable from './GroceryOrders/GroceryOrderTable';
import GroceryOrderDetailsModal from './GroceryOrders/GroceryOrderDetailsModal';
import GroceryOrderDetailsViewModal from './GroceryOrders/GroceryOrderDetailsViewModal';

const GroceryOrders = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedOrder(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedOrder(null);
  };

  const handleOrderUpdate = () => {
    // Refresh the table data
    window.location.reload();
  };

  return (
    <div>
      <GroceryOrderTable onViewOrder={handleViewOrder} onEditOrder={handleEditOrder} />
      <GroceryOrderDetailsViewModal
        order={selectedOrder}
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
      />
      <GroceryOrderDetailsModal
        order={selectedOrder}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUpdate={handleOrderUpdate}
      />
    </div>
  );
};

export default GroceryOrders; 