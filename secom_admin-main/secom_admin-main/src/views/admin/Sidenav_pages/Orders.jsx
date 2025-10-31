import React, { useState } from 'react';
import OrderTable from './Orders/OrderTable';
import OrderDetailsModal from './Orders/OrderDetailsModal';
import OrderDetailsViewModal from './Orders/OrderDetailsViewModal';

const Orders = () => {
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
      <OrderTable onViewOrder={handleViewOrder} onEditOrder={handleEditOrder} />
      <OrderDetailsViewModal
        order={selectedOrder}
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
      />
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUpdate={handleOrderUpdate}
      />
    </div>
  );
};

export default Orders; 