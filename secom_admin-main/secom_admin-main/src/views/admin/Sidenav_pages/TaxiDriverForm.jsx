import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import taxiService from '../../../services/taxiService';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';

console.log('TaxiDriverForm.jsx component file loaded and executing.');

const TaxiDriverForm = () => {
  console.log('TaxiDriverForm component rendering...');
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Validation schema
  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    phone: Yup.string().required('Phone is required'),
    license_number: Yup.string().required('License number is required'),
    status: Yup.string().oneOf(['active', 'inactive', 'offline']).required('Status is required'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema)
  });

  useEffect(() => {
    console.log('TaxiDriverForm useEffect hook triggered. Edit mode:', isEdit);
    if (isEdit) {
      setLoading(true);
      taxiService.getTaxiDriverById(id)
        .then((response) => {
          if (response.success) {
            const data = response.data;
            reset({
              name: data.name,
              phone: data.phone,
              license_number: data.license_number,
              status: data.status,
            });
          } else {
            setError('Failed to load taxi driver');
            toast.error('Failed to load taxi driver');
          }
        })
        .catch(() => {
          setError('Failed to load taxi driver');
          toast.error('Failed to load taxi driver');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      // Get user_id from localStorage
      const userData = JSON.parse(localStorage.getItem('userData'));
      const user_id = userData?._id || userData?.id;
      if (!user_id) {
        setError('User ID not found. Please log in again.');
        toast.error('User ID not found. Please log in again.');
        setLoading(false);
        return;
      }
      const dataToSubmit = {
        ...formData,
        user_id,
      };
      console.log('Submitting taxi driver data:', dataToSubmit);
      if (isEdit) {
        console.log('Updating taxi driver with ID:', id);
        const response = await taxiService.updateTaxiDriver(id, dataToSubmit);
        console.log('Update response:', response);
        toast.success('Taxi driver updated successfully');
      } else {
        console.log('Creating new taxi driver');
        const response = await taxiService.createTaxiDriver(dataToSubmit);
        console.log('Create response:', response);
        toast.success('Taxi driver created successfully');
      }
      navigate('/admin/taxi-drivers');
    } catch (err) {
      console.error('Error in form submission:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.message || 'Failed to save taxi driver';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) return <div className="flex justify-center items-center h-full">Loading...</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">{isEdit ? 'Edit Taxi Driver' : 'Add Taxi Driver'}</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block font-medium">Name</label>
          <input 
            {...register('name')} 
            className="input input-bordered w-full" 
            placeholder="Enter driver name"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block font-medium">Phone</label>
          <input 
            {...register('phone')} 
            className="input input-bordered w-full" 
            placeholder="Enter phone number"
          />
          {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="block font-medium">License Number</label>
          <input 
            {...register('license_number')} 
            className="input input-bordered w-full" 
            placeholder="Enter license number"
          />
          {errors.license_number && <p className="text-red-500 text-sm">{errors.license_number.message}</p>}
        </div>

        <div>
          <label className="block font-medium">Status</label>
          <select {...register('status')} className="input input-bordered w-full">
            <option value="">Select Status</option>
            <option value="inactive">Available</option>
            <option value="active">Unavailable</option>
            <option value="offline">Offline</option>
          </select>
          {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
        </div>

        <div className="flex gap-4">
          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary flex-1"
          >
            {loading ? 'Saving...' : (isEdit ? 'Update Driver' : 'Create Driver')}
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/admin/taxi-drivers')}
            className="btn btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaxiDriverForm; 