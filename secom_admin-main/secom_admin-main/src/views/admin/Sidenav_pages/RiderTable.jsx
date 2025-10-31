import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaEllipsisV, FaEdit, FaEye, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import riderService from '../../../services/riderService';

const RiderTable = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const response = await riderService.getAllRiders();
      console.log('🔍 RiderTable: API response:', response);

      // The apiService already extracts the data, so response is the actual riders array
      if (response && Array.isArray(response)) {
        setRiders(response);
        setError(null); // Clear any previous errors
      } else if (response && response.success && Array.isArray(response.data)) {
        setRiders(response.data);
        setError(null);
      } else {
        setError('Invalid response format');
        toast.error('Invalid response format');
      }
    } catch (err) {
      console.error('🔍 RiderTable: Error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch riders';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (riderId, newStatus) => {
    try {
      const response = await riderService.updateRiderStatus(riderId, newStatus);
      console.log('🔍 RiderTable: Status update response:', response);

      if (response && response.success) {
        setRiders(riders.map(rider =>
          (rider.id || rider._id) === riderId ? { ...rider, status: newStatus } : rider
        ));
        toast.success(response.message || `Rider status updated to ${newStatus}`);
      } else if (response && response.data) {
        // Handle case where apiService extracts the data
        setRiders(riders.map(rider =>
          (rider.id || rider._id) === riderId ? { ...rider, status: newStatus } : rider
        ));
        toast.success(`Rider status updated to ${newStatus}`);
      } else {
        toast.error(response?.message || 'Failed to update rider status');
      }
    } catch (err) {
      console.error('🔍 RiderTable: Status update error:', err);
      toast.error(err.response?.data?.message || 'Failed to update rider status');
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending_verification': return 'Pending Verification';
      case 'active': return 'Available';
      case 'inactive': return 'Unavailable';
      case 'suspended': return 'Suspended';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_verification': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOnlineStatusColor = (isOnline) => {
    return isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const filteredRiders = riders.filter(rider => {
    if (statusFilter === 'all') return true;
    return rider.status === statusFilter;
  });

  if (loading) return <div className="flex justify-center items-center h-full">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Rider Management</h2>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="active">Available</option>
            <option value="inactive">Unavailable</option>
            <option value="suspended">Suspended</option>
          </select>
          {/* <button
            onClick={fetchRiders}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 font-semibold"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button> */}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vehicle
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Status
               </th> */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Online Status
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Stats
               </th> */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 Actions
               </th> */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRiders.map((rider) => (
              <tr key={rider.id || rider._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                        {rider.name?.charAt(0) || 'R'}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{rider.name}</div>
                      <div className="text-sm text-gray-500">{rider.email}</div>
                      <div className="text-sm text-gray-500">{rider.phone}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{rider.vehicle_type}</div>
                  <div className="text-sm text-gray-500">{rider.vehicle_model}</div>
                  <div className="text-sm text-gray-500">{rider.vehicle_number}</div>
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap">
                   <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(rider.status)}`}>
                     {getStatusText(rider.status)}
                   </span>
                 </td> */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOnlineStatusColor(rider.is_online)}`}>
                    {rider.is_online ? 'Online' : 'Offline'}
                  </span>
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                   <div>Trips: {rider.total_orders || 0}</div>
                   <div>Earnings: ₹{rider.total_earnings || 0}</div>
                   <div>Rating: {rider.average_rating || 0}⭐</div>
                 </td> */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(rider.createdAt)}
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                   <div className="flex space-x-2">
                     <button
                       onClick={() => handleStatusUpdate(rider.id || rider._id, 'active')}
                       className="text-green-600 hover:text-green-900"
                       title="Activate"
                     >
                       <FaCheckCircle />
                     </button>
                     <button
                       onClick={() => handleStatusUpdate(rider.id || rider._id, 'inactive')}
                       className="text-red-600 hover:text-red-900"
                       title="Deactivate"
                     >
                       <FaTimesCircle />
                     </button>
                     <Link
                       to={`/admin/riders/view/${rider.id || rider._id}`}
                       className="text-blue-600 hover:text-blue-900"
                       title="View Details"
                     >
                       <FaEye />
                     </Link>
                   </div>
                 </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRiders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No riders found
        </div>
      )}
    </div>
  );
};

export default RiderTable;
