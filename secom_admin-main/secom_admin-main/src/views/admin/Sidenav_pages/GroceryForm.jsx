import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaArrowLeft, FaUpload, FaSpinner } from 'react-icons/fa';
import groceryService from 'services/groceryService';
import API_CONFIG from 'config/api.config';

const GroceryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [multipleImages, setMultipleImages] = useState([]);
  const multipleImagesInputRef = useRef(null);

  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Name is required')
      .min(1, 'Name must be at least 1 character')
      .max(50, 'Name must not exceed 50 characters'),
    description: Yup.string()
      .required('Description is required')
      .min(5, 'Description must be at least 5 characters')
      .max(1000, 'Description must not exceed 1000 characters'),
    original_price: Yup.string()
      .required('Original price is required')
      .matches(/^\d{6}$/, 'Original price must be exactly 6 digits'),
    discounted_price: Yup.string()
      .nullable()
      .matches(/^\d{6}$/, { message: 'Discounted price must be exactly 6 digits', excludeEmptyString: true }),
    rating: Yup.number()
      .transform((v, o) => (o === '' ? null : v))
      .typeError('Must be a number')
      .nullable()
      .min(0, 'Rating must be at least 0')
      .max(5, 'Rating must not exceed 5'),
    is_best_seller: Yup.boolean(),
    quantity: Yup.number()
      .transform((v, o) => (o === '' ? null : v))
      .typeError('Must be a number')
      .nullable()
      .integer('Must be a whole number')
      .min(0, 'Quantity must be positive'),
    category: Yup.string().required('Category is required'),
    status: Yup.boolean().required('Status is required'),
    images: Yup.mixed().test('fileSize', 'Each file must be 5MB or less', (value) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return true;
      const files = Array.isArray(value) ? value : [value];
      return files.every((f) => !(f instanceof File) || (f.size <= 5 * 1024 * 1024));
    }),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      status: true,
      is_best_seller: false,
      images: [],
    },
  });

  // Allow digits and control/navigation keys, enforce max length for price fields
  const isControlKey = (e) =>
    [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
    ].includes(e.key) ||
    ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()));

  const handleKeyDownNumeric = (fieldName) => (e) => {
    if (isControlKey(e)) return;
    if (/^\d$/.test(e.key)) {
      const { value, selectionStart, selectionEnd } = e.currentTarget;
      const nextValue = value.slice(0, selectionStart) + e.key + value.slice(selectionEnd);
      if ((fieldName === 'original_price' || fieldName === 'discounted_price') && nextValue.length > 6) {
        e.preventDefault();
      }
      return;
    }
    e.preventDefault();
  };

  const handlePasteNumeric = (fieldName) => (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text') || '';
    let sanitized = pasted.replace(/[^\d]/g, '').slice(0, 6); // Only digits, max 6
    const input = e.currentTarget;
    const { selectionStart, selectionEnd, value } = input;
    const next = value.slice(0, selectionStart) + sanitized + value.slice(selectionEnd);
    if ((fieldName === 'original_price' || fieldName === 'discounted_price') && next.length > 6) {
      sanitized = sanitized.slice(0, 6 - (value.length - (selectionEnd - selectionStart)));
    }
    const finalValue = value.slice(0, selectionStart) + sanitized + value.slice(selectionEnd);
    if (input.name) {
      setValue(input.name, finalValue.slice(0, 6), { shouldValidate: true, shouldDirty: true });
    } else {
      input.value = finalValue.slice(0, 6);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const handleChangeNumeric = (fieldName) => (e) => {
    let v = e.target.value.replace(/[^\d]/g, '').slice(0, 6); // Only digits, max 6
    if ((fieldName === 'original_price' || fieldName === 'discounted_price') && v.length > 6) {
      v = v.slice(0, 6);
    }
    e.target.value = v;
    if (fieldName) {
      setValue(fieldName, v, { shouldValidate: true, shouldDirty: true });
    }
  };

  useEffect(() => {
    if (isEditMode) {
      groceryService.getGroceryById(id).then((response) => {
        const grocery = response.data;
        Object.keys(grocery).forEach((key) => {
          // Convert numbers to strings for price fields to match input type
          if (key === 'original_price' || key === 'discounted_price') {
            setValue(key, grocery[key] ? String(grocery[key]).padStart(6, '0') : '');
          } else {
            setValue(key, grocery[key]);
          }
        });
        if (Array.isArray(grocery.images) && grocery.images.length > 0) {
          const urls = grocery.images.map((img) => API_CONFIG.getImageUrl(img));
          setImagePreviews(urls);
        }
      });
    }
  }, [id, isEditMode, setValue]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const validFiles = files.filter(
        (file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
      );

      if (validFiles.length !== files.length) {
        toast.error('Some files were invalid. Only image files under 5MB are allowed.');
      }

      const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
      setMultipleImages((prev) => [...prev, ...validFiles]);
    }
  };

  const removeImage = (index) => {
    setImagePreviews((prev) => {
      const next = [...prev];
      const url = next[index];
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
      next.splice(index, 1);
      return next;
    });
    setMultipleImages((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        if (key === 'images') return;
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });

      multipleImages.forEach((file, index) => {
        formData.append(`images[${index}]`, file);
      });

      if (isEditMode) {
        await groceryService.updateGrocery(id, formData);
        toast.success('Grocery updated successfully');
      } else {
        await groceryService.createGrocery(formData);
        toast.success('Grocery created successfully');
      }

      navigate('/admin/groceries');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/admin/groceries')}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <FaArrowLeft className="mr-2" />
              Back to Groceries
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Grocery' : 'Add New Grocery'}
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter grocery name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  {...register('category')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select category</option>
                  <option value="fruits">Fruits</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="dairy">Dairy</option>
                  <option value="meat">Meat</option>
                  <option value="grains">Grains</option>
                  <option value="snacks">Snacks</option>
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Original Price *
                </label>
                <input
                  type="text"
                  {...register('original_price')}
                  name="original_price"
                  onKeyDown={handleKeyDownNumeric('original_price')}
                  onPaste={handlePasteNumeric('original_price')}
                  onChange={handleChangeNumeric('original_price')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.original_price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter 6-digit price"
                />
                {errors.original_price && (
                  <p className="mt-1 text-sm text-red-600">{errors.original_price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discounted Price
                </label>
                <input
                  type="text"
                  {...register('discounted_price')}
                  name="discounted_price"
                  onKeyDown={handleKeyDownNumeric('discounted_price')}
                  onPaste={handlePasteNumeric('discounted_price')}
                  onChange={handleChangeNumeric('discounted_price')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.discounted_price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter 6-digit price"
                />
                {errors.discounted_price && (
                  <p className="mt-1 text-sm text-red-600">{errors.discounted_price.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating (0-5)
                </label>
                <input
                  type="text"
                  {...register('rating')}
                  name="rating"
                  onKeyDown={handleKeyDownNumeric('rating')}
                  onPaste={handlePasteNumeric('rating')}
                  onChange={handleChangeNumeric('rating')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.rating ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter rating (0-5)"
                />
                {errors.rating && (
                  <p className="mt-1 text-sm text-red-600">{errors.rating.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="text"
                  {...register('quantity')}
                  name="quantity"
                  onKeyDown={handleKeyDownNumeric('quantity')}
                  onPaste={handlePasteNumeric('quantity')}
                  onChange={handleChangeNumeric('quantity')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.quantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter quantity"
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('is_best_seller')}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Best Seller</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('status')}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Available</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload images</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        ref={multipleImagesInputRef}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB each</p>
                </div>
              </div>

              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/admin/groceries')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditMode ? 'Update Grocery' : 'Create Grocery'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default GroceryForm;