import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaEllipsisV, FaEdit, FaTrashAlt, FaCheck, FaTimes, FaFileAlt } from 'react-icons/fa';
import PorterDriverService from '../../../../services/porterDriverService';

const PorterDriverTable = () => {
  const [drivers, setDrivers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [showLicenseModal, setShowLicenseModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch existing porter drivers
        await fetchDrivers();
        
        // Fetch pending driver registration requests
        console.log('🔍 Fetching pending porter requests...');
        const pendingResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/driver-registrations/pending-requests`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('🔍 Pending response status:', pendingResponse.status);
        
        if (pendingResponse.ok) {
          const pendingData = await pendingResponse.json();
          console.log('🔍 Raw pending data:', pendingData);
          console.log('🔍 Data type:', typeof pendingData.data);
          console.log('🔍 Data keys:', pendingData.data ? Object.keys(pendingData.data) : 'No data');
          
          // Handle different data structures safely
          let porterRequests = [];
          
          if (pendingData.data && Array.isArray(pendingData.data)) {
            // If data is an array, filter by module_type
            porterRequests = pendingData.data.filter(req => req && req.module_type === 'porter');
          } else if (pendingData.data && typeof pendingData.data === 'object') {
            // If data is an object, look for porter_drivers array
            if (pendingData.data.porter_drivers && Array.isArray(pendingData.data.porter_drivers)) {
              porterRequests = pendingData.data.porter_drivers;
            } else if (pendingData.data.taxi_drivers && Array.isArray(pendingData.data.taxi_drivers)) {
              // If only taxi drivers exist, set empty array
              porterRequests = [];
            }
          }
          
          console.log('🔍 Filtered porter requests:', porterRequests);
          console.log('🔍 Number of porter requests:', porterRequests.length);
          
          setPendingRequests(porterRequests);
        } else {
          console.log('❌ Pending response not ok:', pendingResponse.status);
          const errorText = await pendingResponse.text();
          console.log('❌ Error response:', errorText);
        }
        
      } catch (err) {
        console.error('🚨 Error in fetchData:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch data';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    };
    
    // Add error boundary
    const handleError = (error) => {
      console.error('🚨 Global error caught:', error);
      setError('An unexpected error occurred. Please refresh the page.');
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', (event) => handleError(event.reason));
    
    fetchData();
    
    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await PorterDriverService.getAllDrivers();
      if (response.success) {
        setDrivers(response.data);
      } else {
        setError(response.message || 'Failed to fetch drivers');
        toast.error(response.message || 'Failed to fetch drivers');
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch drivers';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (driverId, newStatus) => {
    try {
      const response = await PorterDriverService.updateDriverStatus(driverId, { status: newStatus });
      if (response.success) {
        toast.success('Driver status updated successfully');
        fetchDrivers();
      } else {
        toast.error(response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (driverId) => {
    if (window.confirm('Are you sure you want to deactivate this driver?')) {
      try {
        const response = await PorterDriverService.deleteDriver(driverId);
        if (response.success) {
          toast.success('Driver deactivated successfully');
          fetchDrivers();
        } else {
          toast.error(response.message || 'Failed to deactivate driver');
        }
      } catch (error) {
        console.error('Error deleting driver:', error);
        toast.error('Failed to deactivate driver');
      }
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'offline': return 'Offline';
      case 'pending_approval': return 'Pending Approval';
      case 'rejected': return 'Rejected';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'offline': return 'bg-red-100 text-red-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const handleApprove = async (requestId, moduleType) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/driver-registrations/update-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          driver_id: requestId,
          module_type: moduleType,
          action: 'approve'
        })
      });

      if (response.ok) {
        toast.success('Driver request approved successfully!');
        // Refresh data
        window.location.reload();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async (requestId, moduleType) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/driver-registrations/update-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          driver_id: requestId,
          module_type: moduleType,
          action: 'reject',
          rejection_reason: reason
        })
      });

      if (response.ok) {
        toast.success('Driver request rejected successfully!');
        // Refresh data
        window.location.reload();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
        toast.error('Failed to reject request');
    }
  };

  const viewLicense = (licensePath) => {
    if (!licensePath) {
      toast.error('No license file available');
      return;
    }
    
    const fullUrl = licensePath.startsWith('http') 
      ? licensePath 
      : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${licensePath}`;
    
    setSelectedLicense(fullUrl);
    setShowLicenseModal(true);
  };

  if (loading) return <div className="flex justify-center items-center h-full">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Porter Drivers</h2>
        <Link
          to="/admin/porter-drivers/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-150"
        >
          Add Porter Driver
        </Link>
      </div>

      {/* Debug Info */}
      {/* <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
        <strong>Debug Info:</strong> 
        Pending Requests: {pendingRequests.length} | 
        Porter Drivers: {drivers.length} | 
        Loading: {loading.toString()} | 
        Error: {error || 'None'}
        <br />
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          🔄 Refresh Data
        </button>
      </div> */}

      {/* Pending Driver Registration Requests */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-yellow-700">
          Pending Driver Registration Requests 
          <span className="text-sm text-gray-500 ml-2">({pendingRequests.length} requests)</span>
        </h3>
        
        {pendingRequests.length === 0 ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-center text-yellow-700">
            No pending requests found. 
            <br />
            {/* <small>This could mean: 1) All requests are processed, 2) API connection issue, 3) No porter requests exist</small> */}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-yellow-50 border border-yellow-200">
              <thead>
                <tr className="bg-yellow-100">
                  <th className="px-4 py-2 border border-yellow-200">Name</th>
                  <th className="px-4 py-2 border border-yellow-200">Email</th>
                  <th className="px-4 py-2 border border-yellow-200">Phone</th>
                  <th className="px-4 py-2 border border-yellow-200">License No</th>
                  <th className="px-4 py-2 border border-yellow-200">License File</th>
                  <th className="px-4 py-2 border border-yellow-200">Request Date</th>
                  <th className="px-4 py-2 border border-yellow-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((request) => {
                  // Safety check - ensure request exists and has required fields
                  if (!request || typeof request !== 'object') {
                    console.warn('🚨 Invalid request object:', request);
                    return null;
                  }
                  
                  return (
                    <tr key={request._id || request.id || Math.random()} className="border-b border-yellow-200 hover:bg-yellow-100">
                      <td className="px-4 py-2 border border-yellow-200">{request.name || 'N/A'}</td>
                      <td className="px-4 py-2 border border-yellow-200">{request.email || 'N/A'}</td>
                      <td className="px-4 py-2 border border-yellow-200">{request.phone || 'N/A'}</td>
                      <td className="px-4 py-2 border border-yellow-200">{request.license_number || 'N/A'}</td>
                      <td className="px-4 py-2 border border-yellow-200">
                        <button
                          onClick={() => viewLicense(request.license_file_path)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                        >
                          <FaFileAlt />
                          View License
                        </button>
                      </td>
                      <td className="px-4 py-2 border border-yellow-200">{formatDate(request.request_date)}</td>
                      <td className="px-4 py-2 border border-yellow-200">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(request._id || request.id, request.module_type || 'porter')}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                          >
                            <FaCheck />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(request._id || request.id, request.module_type || 'porter')}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center gap-1"
                          >
                            <FaTimes />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Phone</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">License No</th>
              <th className="px-4 py-2 border">License File</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Rating</th>
              <th className="px-4 py-2 border">Deliveries</th>
              <th className="px-4 py-2 border">Created At</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-4 py-2 text-center text-gray-500">No porter drivers found</td>
              </tr>
            ) : (
              drivers.map((driver) => (
                <tr key={driver._id} className="border-b hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-4 py-2 border">{driver.name}</td>
                  <td className="px-4 py-2 border">{driver.phone}</td>
                  <td className="px-4 py-2 border">{driver.email || 'N/A'}</td>
                  <td className="px-4 py-2 border">{driver.license_number}</td>
                  <td className="px-4 py-2 border">
                    {driver.license_file_path ? (
                      <button
                        onClick={() => viewLicense(driver.license_file_path)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                      >
                        <FaFileAlt />
                        View
                      </button>
                    ) : (
                      <span className="text-gray-400">No file</span>
                    )}
                  </td>
                  <td className="px-4 py-2 border">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                      {getStatusText(driver.status)}
                    </span>
                  </td>
                  <td className="px-4 py-2 border">⭐ {driver.rating || 0}</td>
                  <td className="px-4 py-2 border">{driver.total_deliveries || 0}</td>
                  <td className="px-4 py-2 border">{formatDate(driver.createdAt)}</td>
                  <td className="px-11 py-2 w-28">
                    <div className="relative inline-block group">
                      <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
                        <FaEllipsisV />
                      </button>
                      <div  className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                        <div className="py-1">
                          <Link
                            to={`/admin/porter-drivers/edit/${driver._id}`}
                          className="text-blue-600 hover:text-blue-600"
                          >
                            <FaEdit className="mr-2" />
                            
                          </Link>
                          {/* <button
                            onClick={() => handleDelete(driver._id)}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          >
                            <FaTrashAlt className="mr-2" />
                            Delete
                          </button> */}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* License Viewing Modal */}
      {showLicenseModal && selectedLicense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Driver License Document</h3>
              <button
                onClick={() => setShowLicenseModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              {selectedLicense.endsWith('.pdf') ? (
                <iframe
                  src={selectedLicense}
                  width="100%"
                  height="500"
                  title="License Document"
                  className="border border-gray-300 rounded"
                />
              ) : (
                <img
                  src={selectedLicense}
                  alt="Driver License"
                  className="max-w-full h-auto border border-gray-300 rounded"
                />
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowLicenseModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PorterDriverTable; 