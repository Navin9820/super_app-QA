import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import warehouseService from '../../../services/warehouseService';

const WarehouseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({
    name: '',
    full_address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    phone: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resolved, setResolved] = useState(null); // {lat,lng}

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setLoading(true);
        const data = await warehouseService.get(id);
        setForm({
          name: data.name || '',
          full_address: data.full_address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          country: data.country || 'India',
          phone: data.phone || '',
          notes: data.notes || ''
        });
        setResolved({ lat: data.latitude, lng: data.longitude });
      } catch (e) {
        setError(e?.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const payload = { ...form };
      const data = isEdit ? await warehouseService.update(id, payload) : await warehouseService.create(payload);
      setResolved({ lat: data.latitude, lng: data.longitude });
      navigate('/admin/warehouses');
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl">
      <h1 className="text-xl font-semibold mb-4">{isEdit ? 'Edit' : 'Add'} Warehouse</h1>
      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input name="name" value={form.name} onChange={onChange} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Full Address</label>
          <textarea name="full_address" value={form.full_address} onChange={onChange} className="w-full border rounded px-3 py-2" required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">City</label>
            <input name="city" value={form.city} onChange={onChange} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm mb-1">State</label>
            <input name="state" value={form.state} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Pincode</label>
            <input name="pincode" value={form.pincode} onChange={onChange} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Country</label>
            <input name="country" value={form.country} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Phone</label>
          <input name="phone" value={form.phone} onChange={onChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Notes</label>
          <textarea name="notes" value={form.notes} onChange={onChange} className="w-full border rounded px-3 py-2" />
        </div>
        {resolved && (
          <div className="text-xs text-gray-600">Resolved Coordinates: {resolved.lat?.toFixed(6)}, {resolved.lng?.toFixed(6)}</div>
        )}
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded">
            {loading ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={()=>navigate('/admin/warehouses')} className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default WarehouseForm;


