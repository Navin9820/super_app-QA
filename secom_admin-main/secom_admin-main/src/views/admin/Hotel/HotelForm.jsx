import React, { useState, useEffect } from 'react';
import { FaTrash } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import HotelService from './HotelService';

const initialState = {
  name: '',
  description: '',
  address: { city: '', state: '', country: '' },
  phone: '',
  email: '',
  status: 'active',
  amenities: [],
  policies: [],
};

function HotelForm() {
  const [hotel, setHotel] = useState(initialState);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [amenities, setAmenities] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [amenitiesData, policiesData] = await Promise.all([
          HotelService.getAllAmenities(),
          HotelService.getAllPolicies(),
        ]);
        setAmenities(amenitiesData);
        setPolicies(policiesData);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      HotelService.getHotelById(id)
        .then((data) => {
          setHotel({
            ...data,
            address: {
              city: data.address?.city || '',
              state: data.address?.state || '',
              country: data.address?.country || '',
            },
            amenities: data.amenities || [],
            policies: data.policies || [],
          });
          setImagePreview(data.main_image ? `${process.env.REACT_APP_API_URL || ''}${data.main_image}` : null);
        })
        .catch(() => setError('Failed to load hotel'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const validateField = (name, value) => {
    let error = '';
    if (!value.trim()) {
      error = `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    } else if (name === 'phone') {
      if (!/^\d{10}$/.test(value)) {
        error = 'Phone number must be exactly 10 digits, no other characters allowed';
      }
    } else if (name === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = 'Please enter a valid email address';
      }
    } else if (['city', 'state', 'country'].includes(name)) {
      if (!/^[a-zA-Z\s]*$/.test(value)) {
        error = 'Only letters and spaces are allowed';
      }
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validate input
    const error = validateField(name, value);
    setValidationErrors((prev) => ({ ...prev, [name]: error }));

    if (name === 'city' || name === 'state' || name === 'country') {
      setHotel((prev) => ({ ...prev, address: { ...prev.address, [name]: value } }));
    } else {
      setHotel((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePhoneKeyPress = (e) => {
    // Allow only digits (0-9), backspace, and arrow keys
    const charCode = e.charCode || e.keyCode;
    if (
      (charCode < 48 || charCode > 57) && // Not a digit
      charCode !== 8 && // Not backspace
      charCode !== 37 && charCode !== 39 // Not left/right arrow
    ) {
      e.preventDefault();
    }
  };

  const handleMultiSelectChange = (e, field) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setHotel((prev) => ({ ...prev, [field]: selectedOptions }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleImageDelete = () => {
    setImage(null);
    setImagePreview(null);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate all fields before submission
    const errors = {};
    ['phone', 'email', 'city', 'state', 'country'].forEach((field) => {
      const value = field === 'phone' || field === 'email' ? hotel[field] : hotel.address[field];
      const error = validateField(field, value);
      if (error) errors[field] = error;
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please fix the validation errors');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', hotel.name);
      formData.append('description', hotel.description);
      formData.append('phone', hotel.phone);
      formData.append('email', hotel.email);
      formData.append('status', hotel.status);
      formData.append('address[city]', hotel.address.city);
      formData.append('address[state]', hotel.address.state);
      formData.append('address[country]', hotel.address.country);

      hotel.amenities.forEach((amenityId) => {
        formData.append('amenities[]', amenityId);
      });
      hotel.policies.forEach((policyId) => {
        formData.append('policies[]', policyId);
      });

      if (image) {
        formData.append('main_image', image);
      }

      if (isEdit) {
        await HotelService.updateHotel(id, formData);
      } else {
        if (!image) {
          setError('Image is required');
          setLoading(false);
          return;
        }
        await HotelService.createHotel(formData);
      }
      navigate('/admin/hotels');
    } catch (err) {
      setError('Select any amenities and policies before saving hotel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{isEdit ? 'Edit Hotel' : 'Add Hotel'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow" encType="multipart/form-data">
        <div>
          <label className="block font-medium mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={hotel.name}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={hotel.description}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-medium mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="city"
              value={hotel.address.city}
              onChange={handleChange}
              required
              className={`w-full border px-3 py-2 rounded ${validationErrors.city ? 'border-red-500' : ''}`}
            />
            {validationErrors.city && <p className="text-red-500 text-sm">{validationErrors.city}</p>}
          </div>
          <div>
            <label className="block font-medium mb-1">
              State <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="state"
              value={hotel.address.state}
              onChange={handleChange}
              required
              className={`w-full border px-3 py-2 rounded ${validationErrors.state ? 'border-red-500' : ''}`}
            />
            {validationErrors.state && <p className="text-red-500 text-sm">{validationErrors.state}</p>}
          </div>
          <div>
            <label className="block font-medium mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="country"
              value={hotel.address.country}
              onChange={handleChange}
              required
              className={`w-full border px-3 py-2 rounded ${validationErrors.country ? 'border-red-500' : ''}`}
            />
            {validationErrors.country && <p className="text-red-500 text-sm">{validationErrors.country}</p>}
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="phone"
            value={hotel.phone}
            onChange={handleChange}
            onKeyPress={handlePhoneKeyPress}
            required
            maxLength={10}
            className={`w-full border px-3 py-2 rounded ${validationErrors.phone ? 'border-red-500' : ''}`}
          />
          {validationErrors.phone && <p className="text-red-500 text-sm">{validationErrors.phone}</p>}
        </div>
        <div>
          <label className="block font-medium mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={hotel.email}
            onChange={handleChange}
            required
            className={`w-full border px-3 py-2 rounded ${validationErrors.email ? 'border-red-500' : ''}`}
          />
          {validationErrors.email && <p className="text-red-500 text-sm">{validationErrors.email}</p>}
        </div>
        <div>
          <label className="block font-medium mb-1">Amenities</label>
          <select
            multiple
            name="amenities"
            value={hotel.amenities}
            onChange={(e) => handleMultiSelectChange(e, 'amenities')}
            className="w-full border px-3 py-2 rounded min-h-[100px]"
          >
            {amenities.map((amenity) => (
              <option key={amenity._id} value={amenity._id}>
                {amenity.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">Hold Ctrl (or Cmd on Mac) to select multiple amenities</p>
        </div>
        <div>
          <label className="block font-medium mb-1">Policies</label>
          <select
            multiple
            name="policies"
            value={hotel.policies}
            onChange={(e) => handleMultiSelectChange(e, 'policies')}
            className="w-full border px-3 py-2 rounded min-h-[100px]"
          >
            {policies.map((policy) => (
              <option key={policy._id} value={policy._id}>
                {policy.title}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">Hold Ctrl (or Cmd on Mac) to select multiple policies</p>
        </div>
        <div>
          <label className="block font-medium mb-1">Status</label>
          <select
            name="status"
            value={hotel.status}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="active">Available</option>
            <option value="inactive">Unavailable</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Main Image {isEdit ? '' : '*'}</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full border px-3 py-2 rounded"
          />
          {imagePreview && (
            <div className="mt-2 relative inline-block">
              <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded" />
              <button
                type="button"
                onClick={handleImageDelete}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors duration-200"
                title="Remove image"
              >
                <FaTrash className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Saving...' : isEdit ? 'Update Hotel' : 'Add Hotel'}
          </button>
          <button
            type="button"
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            onClick={() => navigate('/admin/hotels')}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default HotelForm;