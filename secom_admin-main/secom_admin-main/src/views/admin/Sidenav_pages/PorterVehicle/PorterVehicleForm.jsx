
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Input,
  Select,
  Option,
} from "@material-tailwind/react";
import { toast } from 'react-toastify';
import PorterVehicleService from '../../../../services/porterVehicleService';
import PorterDriverService from '../../../../services/porterDriverService';

const PorterVehicleForm = ({ vehicle, onSave, onCancel }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    vehicle_number: '',
    model: '',
    make: '',
    vehicle_type: 'Bike',
    capacity: 2,
    status: 'active',
    driver_id: ''
  });
  const [errors, setErrors] = useState({
    vehicle_number: '',
    model: '',
    make: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetchingVehicle, setFetchingVehicle] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [fetchingDrivers, setFetchingDrivers] = useState(false);

  useEffect(() => {
    fetchDrivers();
    const editId = vehicle?._id || id;
    if (editId) {
      setIsEditMode(true);
      fetchVehicleData(editId);
    }
  }, [vehicle, id]);

  useEffect(() => {
    console.log('Form data updated:', formData);
    console.log('Current driver_id:', formData.driver_id);
    console.log('Available drivers:', drivers);
  }, [formData, drivers]);

  useEffect(() => {
    if (drivers.length > 0 && formData.driver_id) {
      const driverExists = drivers.find(d => d._id === formData.driver_id);
      if (!driverExists) {
        console.warn('Current driver_id not found in drivers list, clearing it');
        setFormData(prev => ({ ...prev, driver_id: '' }));
      }
    }
  }, [drivers, formData.driver_id]);

  const fetchDrivers = async () => {
    try {
      setFetchingDrivers(true);
      const response = await PorterDriverService.getAllDrivers();
      if (response.success) {
        const driversData = response.data || [];
        console.log('Fetched drivers:', driversData);
        setDrivers(driversData);
      } else {
        console.error('Failed to fetch drivers:', response.message);
        toast.error('Failed to load drivers');
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Failed to load drivers');
    } finally {
      setFetchingDrivers(false);
    }
  };

  const fetchVehicleData = async (vehicleId) => {
    if (!vehicleId) return;
    
    try {
      setFetchingVehicle(true);
      const response = await PorterVehicleService.getVehicleById(vehicleId);
      if (response.success) {
        const vehicleData = response.data;
        console.log('Vehicle data received:', vehicleData);
        
        let driverId = '';
        if (vehicleData.driver_id) {
          if (typeof vehicleData.driver_id === 'string') {
            driverId = vehicleData.driver_id;
          } else if (vehicleData.driver_id._id) {
            driverId = vehicleData.driver_id._id;
          }
        }
        console.log('Extracted driver_id:', driverId);
        
        setFormData({
          vehicle_number: vehicleData.vehicle_number || '',
          model: vehicleData.model || '',
          make: vehicleData.make || '',
          vehicle_type: vehicleData.vehicle_type || 'Bike',
          capacity: vehicleData.capacity || 2,
          status: vehicleData.status || 'active',
          driver_id: driverId
        });
      } else {
        toast.error('Failed to load vehicle data');
      }
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      toast.error('Failed to load vehicle data');
    } finally {
      setFetchingVehicle(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Alphanumeric regex for vehicle_number, model, and make
    const alphanumericRegex = /^[a-zA-Z0-9]*$/;
    
    // Validation rules
    if (name === 'vehicle_number') {
      if (value.length > 8 || !alphanumericRegex.test(value)) {
        return; // Prevent updates if input exceeds 8 chars or contains non-alphanumeric
      }
      setErrors(prev => ({
        ...prev,
        vehicle_number: value.length > 0 && value.length !== 8
          ? 'Vehicle number must be exactly 8 characters'
          : ''
      }));
    } else if (name === 'model') {
      if (value.length > 10 || !alphanumericRegex.test(value)) {
        return; // Prevent updates if input exceeds 10 chars or contains non-alphanumeric
      }
      setErrors(prev => ({
        ...prev,
        model: value.length > 0 && value.length !== 10
          ? 'Model must be exactly 10 characters'
          : ''
      }));
    } else if (name === 'make') {
      if (value.length > 15 || !alphanumericRegex.test(value)) {
        return; // Prevent updates if input exceeds 15 chars or contains non-alphanumeric
      }
      setErrors(prev => ({
        ...prev,
        make: value.length > 0 && value.length !== 15
          ? 'Make must be exactly 15 characters'
          : ''
      }));
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate input lengths
    if (formData.vehicle_number.length !== 8) {
      toast.error('Vehicle number must be exactly 8 characters');
      return;
    }
    if (!/^[a-zA-Z0-9]{8}$/.test(formData.vehicle_number)) {
      toast.error('Vehicle number must be alphanumeric');
      return;
    }
    if (formData.model.length !== 10) {
      toast.error('Model must be exactly 10 characters');
      return;
    }
    if (!/^[a-zA-Z0-9]{10}$/.test(formData.model)) {
      toast.error('Model must be alphanumeric');
      return;
    }
    if (formData.make.length !== 15) {
      toast.error('Make must be exactly 15 characters');
      return;
    }
    if (!/^[a-zA-Z0-9]{15}$/.test(formData.make)) {
      toast.error('Make must be alphanumeric');
      return;
    }

    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData
      };
      
      if (!dataToSubmit.driver_id) {
        delete dataToSubmit.driver_id;
      }

      let response;
      const vehicleId = vehicle?._id || id;
      if (isEditMode && vehicleId) {
        response = await PorterVehicleService.updateVehicle(vehicleId, dataToSubmit);
      } else {
        response = await PorterVehicleService.createVehicle(dataToSubmit);
      }

      if (response.success) {
        toast.success(isEditMode ? 'Vehicle updated successfully' : 'Vehicle created successfully');
        navigate('/admin/porter-vehicles');
      } else {
        toast.error(response.message || 'Failed to save vehicle');
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast.error('Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/porter-vehicles');
  };

  const getCapacityOptions = (vehicleType) => {
    switch (vehicleType) {
      case 'Bike':
        return [1, 2];
      case 'Auto':
        return [2, 3, 4];
      case 'Mini-Truck':
        return [4, 6, 8, 10];
      default:
        return [1, 2, 3, 4];
    }
  };

  const getDriverNameById = (driverId) => {
    if (!driverId) return '';
    const driver = drivers.find(d => d._id === driverId);
    return driver ? driver.name : '';
  };

  if (fetchingVehicle) {
    return (
      <Card className="w-full">
        <CardBody>
          <Typography>Loading vehicle data...</Typography>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader floated={false} shadow={false} className="rounded-none">
        <Typography variant="h5" style={{ color: '#000000' }}>
          {isEditMode ? 'Edit Porter Vehicle' : 'Add New Porter Vehicle'}
        </Typography>
        <Typography color="gray" className="mt-1 font-normal">
          {isEditMode ? 'Update vehicle information' : 'Create a new porter vehicle'}
        </Typography>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Number<span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="vehicle_number"
                value={formData.vehicle_number}
                onChange={handleInputChange}
                maxLength={8}
                pattern="[a-zA-Z0-9]*"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.vehicle_number && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.vehicle_number}
                </Typography>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Make<span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleInputChange}
                maxLength={15}
                pattern="[a-zA-Z0-9]*"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.make && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.make}
                </Typography>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model<span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                maxLength={10}
                pattern="[a-zA-Z0-9]*"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.model && (
                <Typography variant="small" color="red" className="mt-1">
                  {errors.model}
                </Typography>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Type<span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.vehicle_type}
                onChange={(value) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    vehicle_type: value,
                    capacity: getCapacityOptions(value)[0]
                  }));
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Option value="Bike">Bike</Option>
                <Option value="Auto">Auto</Option>
                <Option value="Mini-Truck">Mini-Truck</Option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity<span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.capacity.toString()}
                onChange={(value) => setFormData(prev => ({ ...prev, capacity: parseInt(value) }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {getCapacityOptions(formData.vehicle_type).map(capacity => (
                  <Option key={capacity} value={capacity.toString()}>
                    {capacity} persons
                  </Option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <Select
                value={formData.status}
                onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Option value="active">Active</Option>
                <Option value="maintenance">Maintenance</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Driver (Optional)</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.driver_id || ''}
                onChange={(e) => {
                  console.log('Driver dropdown changed to:', e.target.value);
                  setFormData(prev => ({ ...prev, driver_id: e.target.value }));
                }}
                disabled={fetchingDrivers}
              >
                <option value="">No Driver Assigned</option>
                {drivers.map(driver => (
                  <option key={driver._id} value={driver._id}>
                    {driver.name}
                  </option>
                ))}
              </select>
              {fetchingDrivers && (
                <Typography variant="small" color="gray" className="mt-1">
                  Loading drivers...
                </Typography>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="outlined"
              color="red"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="blue"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update Vehicle' : 'Create Vehicle')}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
};

export default PorterVehicleForm;
