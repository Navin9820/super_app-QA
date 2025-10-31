import React, { useState } from 'react';
import RestaurantOrderTable from './RestaurantOrders/RestaurantOrderTable';
import RestaurantOrderDetailsModal from './RestaurantOrders/RestaurantOrderDetailsModal';
import RestaurantOrderDetailsViewModal from './RestaurantOrders/RestaurantOrderDetailsViewModal';

const RestaurantOrders = () => {
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
      <RestaurantOrderTable onViewOrder={handleViewOrder} onEditOrder={handleEditOrder} />
      <RestaurantOrderDetailsViewModal
        order={selectedOrder}
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
      />
      <RestaurantOrderDetailsModal
        order={selectedOrder}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUpdate={handleOrderUpdate}
      />
    </div>
  );
};

export default RestaurantOrders; 