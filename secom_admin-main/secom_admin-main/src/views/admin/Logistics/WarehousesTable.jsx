import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import warehouseService from '../../../services/warehouseService';

const WarehousesTable = () => {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await warehouseService.list(status === 'all' ? undefined : status);
      setItems(data);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  const shortAddress = (full) => (full?.length > 48 ? full.slice(0, 48) + '…' : full || '-');

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Warehouses</h1>
        <Link to="/admin/warehouses/new" className="px-4 py-2 bg-indigo-600 text-white rounded">Add Warehouse</Link>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <label className="text-sm">Status:</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-2 py-1">
          <option value="active">Available</option>
          <option value="inactive">Unavailable</option>
          <option value="all">All</option>
        </select>
      </div>

      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      {loading ? (
        <div className="text-gray-600">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Address</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Default</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id} className="border-b">
                  <td className="py-2 pr-4">{item.name}</td>
                  <td className="py-2 pr-4">{shortAddress(item.full_address)}</td>
                  <td className="py-2 pr-4">{item.phone || '-'}</td>
                  <td className="py-2 pr-4">{item.isAvailable ? 'Available' : 'Unavailable'}</td>
                  <td className="py-2 pr-4">{item.isDefault ? 'Yes' : 'No'}</td>
                  <td className="py-2 pr-4 flex gap-2">
                    <Link to={`/admin/warehouses/edit/${item._id}`} className="text-indigo-600 flex items-center gap-1">
                      <FaEdit /> 
                    </Link>
                    <button 
                      onClick={async () => { await warehouseService.toggleStatus(item._id); load(); }} 
                      className="text-blue-600" // Changed to blue-600 for blue color
                      title={item.isAvailable ? "Deactivate" : "Activate"}
                    >
                      {item.isAvailable ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                    {!item.isDefault && item.isActive && (
                      <button onClick={async () => { await warehouseService.setDefault(item._id); load(); }} className="text-green-700">Set Default</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WarehousesTable;