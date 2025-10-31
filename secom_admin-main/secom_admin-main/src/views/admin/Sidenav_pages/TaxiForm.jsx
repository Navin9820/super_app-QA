import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import taxiService from '../../../services/taxiService';
import { userService } from '../../../services/userService';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';

// Move these to the top of the file, outside the component
const defaultUsers = [
  { _id: 'default-user-1', name: 'John Doe' },
  { _id: 'default-user-2', name: 'Jane Smith' }
];
const defaultDrivers = [
  { _id: 'default-driver-1', name: 'Driver John' },
  { _id: 'default-driver-2', name: 'Driver Jane' }
];
const defaultVehicles = [
  { _id: 'default-vehicle-1', make: 'Toyota', model: 'Camry', plate_number: 'ABC123' },
  { _id: 'default-vehicle-2', make: 'Honda', model: 'Civic', plate_number: 'XYZ789' }
];

const TaxiForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Validation schema
  const validationSchema = Yup.object().shape({
    user_id: Yup.string().required('User is required'),
    driver_id: Yup.string().required('Driver is required'),
    vehicle_id: Yup.string().required('Vehicle is required'),
    pickup_address: Yup.string().required('Pickup address is required'),
    dropoff_address: Yup.string().required('Dropoff address is required'),
    fare: Yup.number()
      .required('Fare is required')
      .typeError('Fare must be a number')
      .min(0, 'Fare must be greater than or equal to 0'),
    status: Yup.string()
      .oneOf(['pending', 'accepted', 'started', 'completed', 'cancelled'])
      .required('Status is required'),
    started_at: Yup.date().nullable(),
    completed_at: Yup.date().nullable(),
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema)
  });

  // Fix: Always extract correct array for users, drivers, vehicles
  useEffect(() => {
    const fetchData = async () => {
      setDropdownLoading(true);
      try {
        const [driversRes, vehiclesRes, usersRes] = await Promise.all([
          taxiService.getAllTaxiDrivers(),
          taxiService.getAllTaxiVehicles(),
          userService.getAllUsers()
        ]);

        // Debug logging
        console.log('Drivers response:', driversRes);
        console.log('Vehicles response:', vehiclesRes);
        console.log('Users response:', usersRes);

        // Always extract correct array
        setDrivers(Array.isArray(driversRes.data) ? driversRes.data : driversRes.data?.drivers || driversRes.data?.data || []);
        setVehicles(Array.isArray(vehiclesRes.data) ? vehiclesRes.data : vehiclesRes.data?.vehicles || vehiclesRes.data?.data || []);
        setUsers(Array.isArray(usersRes.data?.users) ? usersRes.data.users : usersRes.data?.data || usersRes.data || []);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
        setDrivers(defaultDrivers);
        setVehicles(defaultVehicles);
        setUsers(defaultUsers);
        toast.error('Failed to load dropdown data. Using default options.');
      } finally {
        setDropdownLoading(false);
      }
    };
    fetchData();
  }, []); // Only run once on mount

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch drivers, vehicles, and users for dropdowns
        try {
          const [driversRes, vehiclesRes, usersRes] = await Promise.all([
            taxiService.getAllTaxiDrivers(),
            taxiService.getAllTaxiVehicles(),
            userService.getAllUsers()
          ]);

          // Debug logging
          console.log('Drivers response:', driversRes);
          console.log('Vehicles response:', vehiclesRes);
          console.log('Users response:', usersRes);

          if (driversRes.success) setDrivers(driversRes.data || []);
          else {
            console.error('Failed to fetch drivers:', driversRes);
            setDrivers(defaultDrivers);
          }
          
          if (vehiclesRes.success) setVehicles(vehiclesRes.data || []);
          else {
            console.error('Failed to fetch vehicles:', vehiclesRes);
            setVehicles(defaultVehicles);
          }
          
          if (usersRes.success) setUsers(usersRes.data?.users || usersRes.data || []);
          else {
            console.error('Failed to fetch users:', usersRes);
            setUsers(defaultUsers);
          }
        } catch (error) {
          console.error('Error fetching dropdown data:', error);
          setDrivers(defaultDrivers);
          setVehicles(defaultVehicles);
          setUsers(defaultUsers);
          
          // Show error message to user
          toast.error('Failed to load dropdown data. Using default options.');
        } finally {
          setDropdownLoading(false);
        }

        if (isEdit) {
          setLoading(true);
          const res = await taxiService.getTaxiRideById(id);
          if (res.success) {
            const data = res.data;
            
            // Debug logging for date fields
            console.log('Taxi ride data received:', {
              id: data._id,
              createdAt: data.createdAt,
              started_at: data.started_at,
              completed_at: data.completed_at,
              started_at_type: typeof data.started_at,
              completed_at_type: typeof data.completed_at
            });
            
            // Helper function to safely format date
            const formatDateForInput = (dateValue) => {
              if (!dateValue) return '';
              try {
                const date = new Date(dateValue);
                if (isNaN(date.getTime())) return '';
                return date.toISOString().slice(0, 16);
              } catch (error) {
                console.error('Error formatting date:', error, 'Value:', dateValue);
                return '';
              }
            };
            
            reset({
              user_id: data.user_id?._id || data.user_id,
              driver_id: data.driver_id?._id || data.driver_id,
              vehicle_id: data.vehicle_id?._id || data.vehicle_id,
              pickup_address: data.pickup_location?.address || '',
              dropoff_address: data.dropoff_location?.address || '',
              fare: data.fare,
              status: data.status,
              requested_at: formatDateForInput(data.createdAt),
              started_at: formatDateForInput(data.started_at),
              completed_at: formatDateForInput(data.completed_at),
            });
          } else {
            setError('Failed to load taxi ride');
            toast.error('Failed to load taxi ride');
          }
        }
      } catch (err) {
        setError('Failed to load data');
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEdit, reset]);

  // Add debug logging and user-friendly error messages for failed submissions
  const onSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      // Always use logged-in user's ID for user_id
      const userData = JSON.parse(localStorage.getItem('userData'));
      const user_id = formData.user_id || userData?._id || userData?.id;
      if (!user_id) {
        setError('User ID not found. Please log in again.');
        toast.error('User ID not found. Please log in again.');
        setLoading(false);
        return;
      }
      if (!formData.driver_id || !formData.vehicle_id) {
        setError('Driver and Vehicle are required.');
        toast.error('Driver and Vehicle are required.');
        setLoading(false);
        return;
      }
      const data = {
        user_id,
        driver_id: formData.driver_id,
        vehicle_id: formData.vehicle_id,
        pickup_location: {
          address: formData.pickup_address
        },
        dropoff_location: {
          address: formData.dropoff_address
        },
        fare: formData.fare,
        status: formData.status,
        started_at: formData.started_at || null,
        completed_at: formData.completed_at || null,
      };
      console.log('Submitting taxi ride data:', data);
      if (isEdit) {
        await taxiService.updateTaxiRide(id, data);
        toast.success('Taxi ride updated successfully');
      } else {
        await taxiService.createTaxiRide(data);
        toast.success('Taxi ride created successfully');
      }
      navigate('/admin/taxi-rides');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to save taxi ride';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Taxi ride submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) return <div className="flex justify-center items-center h-full">Loading...</div>;

  // Add debug log for validation errors
  console.log('Form validation errors:', errors);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">{isEdit ? 'Edit Taxi Ride' : 'Add Taxi Ride'}</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">User</label>
            <select {...register('user_id')} className="input input-bordered w-full" disabled={dropdownLoading}>
              <option value="">{dropdownLoading ? 'Loading users...' : 'Select User'}</option>
              {Array.isArray(users) && users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                </option>
              ))}
            </select>
            {errors.user_id && <p className="text-red-500 text-sm">{errors.user_id.message}</p>}
          </div>

          <div>
            <label className="block font-medium">Driver</label>
            <select {...register('driver_id')} className="input input-bordered w-full" disabled={dropdownLoading}>
              <option value="">{dropdownLoading ? 'Loading drivers...' : 'Select Driver'}</option>
              {Array.isArray(drivers) && drivers.map(driver => (
                <option key={driver._id} value={driver._id}>
                  {driver.name}
                </option>
              ))}
            </select>
            {errors.driver_id && <p className="text-red-500 text-sm">{errors.driver_id.message}</p>}
          </div>

          <div>
            <label className="block font-medium">Vehicle</label>
            <select {...register('vehicle_id')} className="input input-bordered w-full" disabled={dropdownLoading}>
              <option value="">{dropdownLoading ? 'Loading vehicles...' : 'Select Vehicle'}</option>
              {Array.isArray(vehicles) && vehicles.map(vehicle => (
                <option key={vehicle._id} value={vehicle._id}>
                  {vehicle.make} {vehicle.model} - {vehicle.plate_number}
                </option>
              ))}
            </select>
            {errors.vehicle_id && <p className="text-red-500 text-sm">{errors.vehicle_id.message}</p>}
          </div>

          <div>
            <label className="block font-medium">Status</label>
            <select {...register('status')} className="input input-bordered w-full">
              <option value="">Select Status</option>
              <option value="pending">Requested</option>
              <option value="accepted">Accepted</option>
              <option value="started">Started</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
          </div>
        </div>

        <div>
          <label className="block font-medium">Pickup Location</label>
          <input {...register('pickup_address')} placeholder="Pickup Address" className="input input-bordered w-full" />
          {errors.pickup_address && <p className="text-red-500 text-sm">{errors.pickup_address.message}</p>}
        </div>

        <div>
          <label className="block font-medium">Dropoff Location</label>
          <input {...register('dropoff_address')} placeholder="Dropoff Address" className="input input-bordered w-full" />
          {errors.dropoff_address && <p className="text-red-500 text-sm">{errors.dropoff_address.message}</p>}
        </div>

        <div>
          <label className="block font-medium">Fare</label>
          <input 
            type="number" 
            step="0.01" 
            {...register('fare')} 
            className="input input-bordered w-full" 
          />
          {errors.fare && <p className="text-red-500 text-sm">{errors.fare.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-medium">Requested At</label>
            <input 
              type="datetime-local" 
              {...register('requested_at')} 
              className="input input-bordered w-full bg-gray-100" 
              readOnly
              disabled
            />
            <p className="text-gray-500 text-xs mt-1">This is automatically set when the ride is created</p>
          </div>

          <div>
            <label className="block font-medium">Started At </label>
            <input 
              type="datetime-local" 
              {...register('started_at')} 
              className="input input-bordered w-full" 
            />
            {errors.started_at && <p className="text-red-500 text-sm">{"Select a valid starting date & time"}</p>}
          </div>

          <div>
            <label className="block font-medium">Completed At </label>
            <input 
              type="datetime-local" 
              {...register('completed_at')} 
              className="input input-bordered w-full" 
            />
            {errors.completed_at && <p className="text-red-500 text-sm">{"Select a valid ending date & time"}</p>}
          </div>
        </div>

        <div className="flex space-x-4">
          <button 
            type="submit" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => console.log('Add Taxi Ride button clicked!')}
            disabled={loading}
          >
            {loading ? 'Saving...' : isEdit ? 'Update Taxi Ride' : 'Add Taxi Ride'}
          </button>
          <button 
            type="button" 
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            onClick={() => navigate('/admin/taxi-rides')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaxiForm; 