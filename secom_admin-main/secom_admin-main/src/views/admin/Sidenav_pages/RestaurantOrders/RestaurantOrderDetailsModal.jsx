import React, { useState } from 'react';
import { adminRestaurantOrderService } from 'services/orderService';
import { toast } from 'react-toastify';
import { FaTimes, FaSave, FaShippingFast, FaCreditCard } from 'react-icons/fa';

const RestaurantOrderDetailsModal = ({ order, isOpen, onClose, onUpdate }) => {
  const [status, setStatus] = useState(order?.status || '');
  const [notes, setNotes] = useState(order?.notes || '');
  const [loading, setLoading] = useState(false);

  const handleStatusUpdate = async () => {
    setLoading(true);
    try {
      await adminRestaurantOrderService.updateRestaurantOrderStatus(order.id, {
        status,
        notes
      });
      toast.success('Restaurant order updated successfully');
      onUpdate();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to update restaurant order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-indigo-100 text-indigo-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Update Restaurant Order
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Order Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Order Number:</span>
                <p className="text-sm text-gray-900">{order.order_number}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Order Date:</span>
                <p className="text-sm text-gray-900">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Restaurant:</span>
                <p className="text-sm text-gray-900">{order.restaurant?.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Customer:</span>
                <p className="text-sm text-gray-900">{order.user?.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Total Amount:</span>
                <p className="text-sm font-medium text-gray-900">{formatCurrency(order.total_amount)}</p>
              </div>
            </div>
          </div>

          {/* Status Update */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any notes about this order..."
                />
              </div>
            </div>
          </div>

          {/* Current Status Display */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Status</h4>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleStatusUpdate}
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <FaSave className="mr-2" />
            {loading ? 'Updating...' : 'Update Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantOrderDetailsModal; 