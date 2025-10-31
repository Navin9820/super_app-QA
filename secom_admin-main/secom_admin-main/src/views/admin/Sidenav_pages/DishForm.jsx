import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardBody,
  Typography,
  Button,
  Input,
  Textarea,
} from '@material-tailwind/react';
import { useParams, useNavigate } from 'react-router-dom';
import { dishService, restaurantService } from '../../../services/restaurantService';
import API_CONFIG from '../../../config/api.config';
import { toast } from 'react-toastify';

const generateSlug = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/ /g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');

const DishForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    restaurant_id: '',
    status: true,
  });
  const [restaurants, setRestaurants] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [multipleImages, setMultipleImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const multipleImagesInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const data = await restaurantService.getAll();
        setRestaurants(data);
      } catch (error) {
        toast.error('Failed to fetch restaurants');
      }
    };
    fetchRestaurants();
  }, []);

  // Fetch dish if edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchDish = async () => {
        try {
          setLoading(true);
          const dish = await dishService.getById(id);
          
          let restaurantId = '';
          if (dish.restaurant_id) {
            if (typeof dish.restaurant_id === 'object' && dish.restaurant_id._id) {
              restaurantId = dish.restaurant_id._id;
            } else {
              restaurantId = String(dish.restaurant_id);
            }
          }
          
          setFormData({
            name: dish.name || '',
            slug: dish.slug || generateSlug(dish.name || ''),
            description: dish.description || '',
            price: dish.price ? String(dish.price) : '',
            restaurant_id: restaurantId,
            status: dish.status !== undefined ? dish.status : true,
          });
          if (dish.image) {
            setImagePreview(API_CONFIG.getImageUrl(dish.image));
          }
          setImageRemoved(false);
          
          if (dish.images && Array.isArray(dish.images)) {
            const imageUrls = dish.images.map(img => API_CONFIG.getImageUrl(img));
            setExistingImages(imageUrls);
          }
        } catch (error) {
          toast.error('Failed to fetch dish details');
          navigate('/admin/dish');
        } finally {
          setLoading(false);
        }
      };
      fetchDish();
    }
  }, [isEditMode, id, navigate]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    if (field === 'name') {
      // Restrict name to 50 characters
      if (value.length <= 50) {
        setFormData(prev => ({
          ...prev,
          name: value,
          slug: prev.slug ? prev.slug : generateSlug(value),
        }));
      }
    } else if (field === 'slug') {
      setFormData(prev => ({ ...prev, slug: generateSlug(value) }));
    } else if (field === 'restaurant_id') {
      setFormData(prev => ({ ...prev, [field]: value ? String(value) : '' }));
    } else if (field === 'status') {
      setFormData(prev => ({ ...prev, [field]: !!value }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        toast.error('Only JPEG, PNG, and GIF images are allowed. Please select a different image.');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      setImageFile(file);
      setImageRemoved(false);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Remove main image
  const removeMainImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageRemoved(true);
  };

  // Handle multiple images
  const handleMultipleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setMultipleImages(files);
  };

  // Remove image from multiple images
  const removeImage = (index) => {
    const newImages = multipleImages.filter((_, i) => i !== index);
    setMultipleImages(newImages);
  };

  // Remove existing image
  const removeExistingImage = (index) => {
    const newImages = existingImages.filter((_, i) => i !== index);
    setExistingImages(newImages);
  };

  // Reorder images
  const reorderImages = (fromIndex, toIndex) => {
    const newImages = [...existingImages];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    setExistingImages(newImages);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name must be 50 characters or less';
    } else if (formData.name.length < 1) {
      newErrors.name = 'Name must be at least 1 character';
    }
    if (!formData.slug.trim()) newErrors.slug = 'Dish Code is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.restaurant_id) newErrors.restaurant_id = 'Restaurant is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    try {
      setLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('slug', formData.slug);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', parseFloat(formData.price));
      formDataToSend.append('restaurant_id', formData.restaurant_id);
      formDataToSend.append('status', formData.status);
      
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      } else if (imageRemoved) {
        formDataToSend.append('remove_image', 'true');
      }

      if (multipleImages.length > 0) {
        multipleImages.forEach((file, index) => {
          formDataToSend.append('multiple_images', file);
        });
      }
      
      console.log('Submitting dish with name:', formData.name);
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0]+ ': ' + pair[1]);
      }
      if (isEditMode) {
        await dishService.update(id, formDataToSend);
        toast.success('Dish updated successfully');
      } else {
        await dishService.create(formDataToSend);
        toast.success('Dish created successfully');
      }
      navigate('/admin/dish');
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      
      let errorMessage = 'Failed to save dish';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <Typography variant="h6">Loading dish...</Typography>
      </div>
    );
  }

  return (
    <div className="mt-8 mb-8 flex flex-col items-center gap-8">
      <Card className="w-full max-w-2xl shadow-lg p-2">
        <CardBody>
          <Typography variant="h5" color="blue-gray" className="mb-6 font-bold">
            {isEditMode ? 'Edit Dish' : 'Add Dish'}
          </Typography>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name 
                <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                error={!!errors.name}
                placeholder="Enter dish name "
                maxLength={50}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dish Code
                 <span className="text-red-500">*</span>
               </label>
              <Input
                type="text"
                value={formData.slug}
                onChange={e => handleInputChange('slug', e.target.value)}
                error={!!errors.slug}
                placeholder="Auto-generated from name, or edit manually"
              />
              {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description
                 <span className="text-red-500">*</span>
               </label>
              <Textarea
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                error={!!errors.description}
                placeholder="Enter dish description"
                rows={4}
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price 
                <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={e => handleInputChange('price', e.target.value)}
                error={!!errors.price}
                placeholder="Enter price"
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant
                 <span className="text-red-500">*</span>
               </label>
              <select
                className="block w-full rounded border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.restaurant_id}
                onChange={e => handleInputChange('restaurant_id', e.target.value)}
              >
                <option value="">Select restaurant</option>
                {restaurants.filter(rest => rest.status).map(restaurant => (
                  <option key={restaurant._id} value={restaurant._id}>{restaurant.name}</option>
                ))}
              </select>
              {errors.restaurant_id && <p className="mt-1 text-sm text-red-600">{errors.restaurant_id}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
              {imagePreview ? (
                <div className="relative w-32 h-32 mb-2">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg border" />
                  <button type="button" onClick={removeMainImage} className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-700">Remove</button>
                </div>
              ) : null}
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-sm text-gray-500 mt-1">Upload main dish image (JPEG, PNG, or GIF only)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Dish Images
              </label>
              <div className="space-y-4">
                {existingImages.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Current Images ({existingImages.length})</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {existingImages.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={url} 
                            alt={`Image ${idx + 1}`} 
                            className="h-20 w-20 rounded-lg object-cover border cursor-move hover:opacity-80" 
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-1">
                            {idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {multipleImages.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">New Images to Upload ({multipleImages.length})</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {multipleImages.map((file, idx) => (
                        <div key={idx} className="relative">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={`New ${idx + 1}`} 
                            className="h-20 w-20 rounded-lg object-cover border" 
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => multipleImagesInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <span>Add More Images</span>
                  </button>
                  <input 
                    type="file" 
                    accept="image/jpeg,image/jpg,image/png,image/gif" 
                    multiple 
                    onChange={handleMultipleImagesChange} 
                    className="hidden" 
                    ref={multipleImagesInputRef} 
                  />
                  <span className="text-sm text-gray-500">Select multiple image files (JPEG, PNG, or GIF only, max 5MB each)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="status-toggle"
                checked={!!formData.status}
                onChange={e => handleInputChange('status', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="status-toggle" className="ml-2 text-sm text-gray-700 select-none">
                {formData.status ? 'Available' : 'Unavailable'}
              </label>
              <span className="ml-2 text-sm text-gray-600">Available: Dish will be visible</span>
            </div>
            <div className="flex gap-4 pt-4 justify-end">
              <Button
                type="submit"
                color="blue"
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? 'Saving...' : (isEditMode ? 'Update Dish' : 'Create Dish')}
              </Button>
              <Button
                type="button"
                variant="outlined"
                color="gray"
                onClick={() => navigate('/admin/dish')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default DishForm;