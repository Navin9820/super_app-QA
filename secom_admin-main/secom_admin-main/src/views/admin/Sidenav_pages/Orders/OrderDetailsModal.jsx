import React, { useState } from 'react';
import { adminOrderService } from 'services/orderService';
import { toast } from 'react-toastify';
import { FaTimes, FaSave, FaShippingFast, FaCreditCard } from 'react-icons/fa';

const OrderDetailsModal = ({ order, isOpen, onClose, onUpdate }) => {
  const [status, setStatus] = useState(order?.status || '');
  const [trackingNumber, setTrackingNumber] = useState(order?.tracking_number || '');
  const [notes, setNotes] = useState(order?.notes || '');
  const [loading, setLoading] = useState(false);

  const handleStatusUpdate = async () => {
    setLoading(true);
    try {
      await adminOrderService.updateOrderStatus(order.id, {
        status,
        tracking_number: trackingNumber,
        notes
      });
      toast.success('Order updated successfully');
      onUpdate();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="relative w-full max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto p-0">
        <div className="bg-white rounded-md shadow-lg overflow-hidden flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex justify-between items-center px-5 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              Order Details - {order.order_number}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="h-6 w-6" />
            </button>
          </div>
          {/* Scrollable Content */}
          <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: '60vh' }}>
            {/* Order Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <FaCreditCard className="mr-2" />
                  Customer Information
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Name:</strong> {order.user?.name}</p>
                  <p><strong>Email:</strong> {order.user?.email}</p>
                  <p><strong>Phone:</strong> {order.user?.phone || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <FaShippingFast className="mr-2" />
                  Order Summary
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Date:</strong> {formatDate(order.created_at)}</p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </p>
                  <p><strong>Payment:</strong> {order.payment_method} 
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                      {order.payment_status}
                    </span>
                  </p>
                  <p><strong>Total:</strong> {formatCurrency(order.total_amount)}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <img
                              src={item.product_data?.image || '/placeholder.png'}
                              alt={item.product_data?.name || 'Product'}
                              className="h-12 w-12 rounded object-cover mr-3"
                            />
                            <div>
                              <div className="font-medium text-sm">{item.product_data?.name || 'N/A'}</div>
                              <div className="text-gray-500 text-xs">{item.product_data?.sku || ''}</div>
                              {item.product_data?.variation && (
                                <div className="text-gray-400 text-xs">
                                  {item.product_data.variation.attributes &&
                                    Object.entries(item.product_data.variation.attributes).map(([key, value]) => (
                                      <span key={key} className="mr-2">{key}: {value}</span>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.original_price && item.discounted_price && item.original_price !== item.discounted_price ? (
                            <>
                              <span className="line-through text-gray-400 mr-2">
                                {formatCurrency(item.original_price)}
                              </span>
                              <span className="font-bold text-green-600">
                                {formatCurrency(item.discounted_price)}
                              </span>
                            </>
                          ) : (
                            <span className="font-bold text-gray-900">
                              {formatCurrency(item.discounted_price || item.original_price || item.price)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                          {formatCurrency(item.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Totals */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Order Totals</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm font-medium">{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tax:</span>
                    <span className="text-sm font-medium">{formatCurrency(order.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Shipping:</span>
                    <span className="text-sm font-medium">{formatCurrency(order.shipping_amount)}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Discount:</span>
                      <span className="text-sm font-medium text-red-600">-{formatCurrency(order.discount_amount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Total:</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Shipping Address</h4>
                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  {order.shipping_address?.address_line1 && <p>{order.shipping_address.address_line1}</p>}
                  {order.shipping_address?.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                  {order.shipping_address?.city && order.shipping_address?.state && (
                    <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
                  )}
                  {order.shipping_address?.country && order.shipping_address?.pincode && (
                    <p>{order.shipping_address.country} {order.shipping_address.pincode}</p>
                  )}
                  {!order.shipping_address && (
                    <p className="text-gray-400 italic">No shipping address provided</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Billing Address</h4>
                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  {order.billing_address?.address_line1 && <p>{order.billing_address.address_line1}</p>}
                  {order.billing_address?.address_line2 && <p>{order.billing_address.address_line2}</p>}
                  {order.billing_address?.city && order.billing_address?.state && (
                    <p>{order.billing_address.city}, {order.billing_address.state}</p>
                  )}
                  {order.billing_address?.country && order.billing_address?.pincode && (
                    <p>{order.billing_address.country} {order.billing_address.pincode}</p>
                  )}
                  {!order.billing_address && (
                    <p className="text-gray-400 italic">Same as shipping address</p>
                  )}
                </div>
              </div>
            </div>

            {/* Update Form */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-4">Update Order</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add order notes..."
                  className="w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="flex justify-end space-x-3 px-5 py-4 border-t bg-gray-50">
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
    </div>
  );
};

export default OrderDetailsModal; 