import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaArrowLeft, FaUpload, FaSpinner } from 'react-icons/fa';
import brandService from '../../../services/brandService';
import API_CONFIG from '../../../config/api.config';

const BrandForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  // Validation schema
  const validationSchema = Yup.object({
    brand_name: Yup.string()
      .required('Brand name is required')
      .min(6, 'Brand name must be at least 6 characters')
      .max(20, 'Brand name must not exceed 20 characters'),
    photo: Yup.mixed()
      .test('fileType', 'Only image files are allowed', (value) => {
        if (!value) return true; // Allow empty for edit mode
        return value instanceof File && value.type.startsWith('image/');
      })
      .test('fileSize', 'File size must be less than 5MB', (value) => {
        if (!value) return true; // Allow empty for edit mode
        return value instanceof File && value.size <= 5 * 1024 * 1024;
      }),
    status: Yup.boolean().required('Status is required'),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      brand_name: '',
      status: true,
    },
  });

  // Fetch brand data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchBrandData();
    }
  }, [id]);

  const fetchBrandData = async () => {
    try {
      setLoading(true);
      const response = await brandService.getAllBrands();
      const brand = response.find(b => b.id == id);
      
      if (brand) {
        setValue('brand_name', brand.brand_name);
        setValue('status', brand.status);
        if (brand.photo) {
          const imageUrl = API_CONFIG.getImageUrl(brand.photo);
          setExistingImage(imageUrl);
          setImagePreview(imageUrl);
        }
      } else {
        toast.error('Brand not found');
        navigate('/admin/brands');
      }
    } catch (error) {
      console.error('Error fetching brand:', error);
      toast.error('Failed to fetch brand data');
      navigate('/admin/brands');
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setValue('photo', file);
    }
  };

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('brand_name', data.brand_name);
      formData.append('status', data.status);
      
      if (data.photo) {
        formData.append('brand_image', data.photo);
      }

      // --- NEW LOGGING ---
      console.log("Submitting FormData from BrandForm.jsx:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      // --- END NEW LOGGING ---

      if (isEditMode) {
        await brandService.updateBrand(id, formData);
        toast.success('Brand updated successfully');
      } else {
        await brandService.createBrand(formData);
        toast.success('Brand created successfully');
      }
      
      navigate('/admin/brands');
    } catch (error) {
      console.error('Error saving brand:', error);
      
      // Handle specific error messages
      if (error.response?.status === 400 && error.response?.data?.message === 'This brand already exists') {
        toast.error('This brand already exists', {
          style: {
            backgroundColor: '#3B82F6',
            color: 'white',
            border: '1px solid #2563EB'
          }
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to save brand');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/brands');
  };

  if (loading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <ToastContainer />
      
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={handleBack}
          className="mr-4 p-2 text-gray-600 hover:text-gray-800"
        >
          <FaArrowLeft className="text-lg" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'Edit Brand' : 'Add New Brand'}
        </h1>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Brand Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              {...register('brand_name')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.brand_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter brand name"
              maxLength="20"
            />
            {errors.brand_name && (
              <p className="mt-1 text-sm text-red-600">{errors.brand_name.message}</p>
            )}
          </div>

          {/* Brand Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Image
            </label>
            <div className="space-y-4">
              {/* Image Preview */}
              {(imagePreview || existingImage) && (
                <div className="flex items-center space-x-4">
                  <img
                    src={imagePreview || existingImage}
                    alt="Brand preview"
                    className="h-20 w-20 rounded-lg object-cover border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setExistingImage(null);
                      setValue('photo', null);
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove Image
                  </button>
                </div>
              )}
              
              {/* File Upload */}
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FaUpload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            {errors.photo && (
              <p className="mt-1 text-sm text-red-600">{errors.photo.message}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-600">*</span>
            </label>
            <select
              {...register('status')}
              value={watch('status')}
              onChange={(e) => setValue('status', e.target.value === 'true')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.status ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value={true}>Available</option>
              <option value={false}>Unavailable</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <FaSpinner className="animate-spin mr-2" />}
              {isEditMode ? 'Update Brand' : 'Create Brand'}
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrandForm;