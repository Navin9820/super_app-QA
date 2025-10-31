import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaArrowLeft, FaUpload, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import API_CONFIG from '../../../config/api.config';

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const fileInputRef = useRef(null);
  const [multipleImages, setMultipleImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const multipleImagesInputRef = useRef(null);
  const [forceRender, setForceRender] = useState(0);

  // Validation schema with updated product name constraints
  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Product name is required')
      .min(1, 'Product name must be at least 1 character')
      .max(50, 'Product name must not exceed 50 characters')
      .matches(/^[a-zA-Z0-9]+$/, 'Product name can only contain letters and numbers'),
    description: Yup.string()
      .max(1000, 'Description must not exceed 1000 characters'),
    price: Yup.number()
      .required('Price is required')
      .positive('Price must be positive')
      .min(0, 'Price cannot be negative')
      .test('maxDigits', 'Price must not exceed 12 digits', (value) => 
        value.toString().replace('.', '').length <= 12),
    sale_price: Yup.number()
      .positive('Sale price must be positive')
      .min(0, 'Sale price cannot be negative')
      .test('maxDigits', 'Sale price must not exceed 12 digits', (value) => 
        !value || value.toString().replace('.', '').length <= 12),
    stock: Yup.number()
      .required('Stock is required')
      .integer('Stock must be a whole number')
      .min(0, 'Stock cannot be negative')
      .max(999, 'Stock must not exceed 3 digits'),
    sku: Yup.string()
      .required('Product Code is required')
      .min(2, 'Product Code must be at least 2 characters')
      .max(10, 'Product Code must not exceed 10 characters'),
    slug: Yup.string()
      .required('Category Code is required')
      .min(2, 'Category Code must be at least 2 characters')
      .max(10, 'Category Code must not exceed 10 characters'),
    brand_id: Yup.string().required('Brand is required'),
    category_id: Yup.string().required('Category is required'),
    sub_category_id: Yup.string(),
    status: Yup.boolean().required('Status is required'),
    meta_title: Yup.string().max(60, 'Title must not exceed 60 characters'),
    meta_description: Yup.string().max(160, 'Description must not exceed 160 characters'),
    photo: Yup.mixed()
      .test('fileType', 'Only image files are allowed', (value) => {
        if (!value) return true;
        return value instanceof File && value.type.startsWith('image/');
      })
      .test('fileSize', 'File size must be less than 5MB', (value) => {
        if (!value) return true;
        return value instanceof File && value.size <= 5 * 1024 * 1024;
      }),
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
      name: '',
      description: '',
      price: '',
      sale_price: '',
      stock: 0,
      sku: '',
      slug: '',
      brand_id: '',
      category_id: '',
      sub_category_id: '',
      status: true,
      meta_title: '',
      meta_description: '',
    },
  });

  const selectedBrand = watch('brand_id');
  const selectedCategory = watch('category_id');
  const stockValue = watch('stock');
  const priceValue = watch('price');

  // Auto-calculate price based on stock
  useEffect(() => {
    if (stockValue && priceValue) {
      const basePrice = parseFloat(priceValue) / (parseInt(stockValue) || 1);
      setValue('price', (basePrice * (parseInt(stockValue) || 1)).toFixed(2));
    }
  }, [stockValue, setValue]);

  // Fetch brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('jwt');
        const response = await axios.get(`${API_CONFIG.BASE_URL}/api/admin/get_all_brand?dropdown=true`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 10000
        });
        const brandsData = Array.isArray(response.data) 
          ? response.data 
          : Array.isArray(response.data.data) 
            ? response.data.data 
            : [];
        setBrands(brandsData);
      } catch (error) {
        console.error('❌ Error fetching brands:', error);
        toast.error('Failed to load brands');
        setBrands([]);
      }
    };
    fetchBrands();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('jwt');
        const response = await axios.get(`${API_CONFIG.BASE_URL}/api/categories?dropdown=true`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 10000
        });
        const categoriesData = Array.isArray(response.data) 
          ? response.data 
          : Array.isArray(response.data.data) 
            ? response.data.data 
            : [];
        setCategories(categoriesData);
      } catch (error) {
        console.error('❌ Error fetching categories:', error);
        toast.error('Failed to load categories');
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Filter subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      const categoryId = typeof selectedCategory === 'object' ? selectedCategory._id : selectedCategory;
      const filteredSubCategories = Array.isArray(categories) ? categories.filter(cat => {
        const parentId = cat.parent_id;
        return String(parentId) === String(categoryId);
      }) : [];
      setSubCategories(filteredSubCategories);
      
      if (!isEditMode) {
        setValue('sub_category_id', '');
      }
    } else {
      setSubCategories([]);
      if (!isEditMode) {
        setValue('sub_category_id', '');
      }
    }
  }, [selectedCategory, categories, setValue, isEditMode]);

  // Fetch product data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchProductData();
    }
  }, [id]);

  // Trigger subcategory filtering when product data is loaded in edit mode
  useEffect(() => {
    if (isEditMode && Array.isArray(categories) && categories.length > 0 && watch('category_id')) {
      const currentCategoryId = watch('category_id');
      if (currentCategoryId) {
        const filteredSubCategories = Array.isArray(categories) ? categories.filter(cat => {
          const parentId = cat.parent_id;
          return String(parentId) === String(currentCategoryId);
        }) : [];
        setSubCategories(filteredSubCategories);
        setTimeout(() => {
          setForceRender(prev => prev + 1);
        }, 100);
      }
    }
  }, [categories, isEditMode, watch('category_id')]);

  // Additional useEffect to ensure subcategory value is set in edit mode
  useEffect(() => {
    if (isEditMode && Array.isArray(subCategories) && subCategories.length > 0) {
      const currentSubCategoryValue = watch('sub_category_id');
      if (!currentSubCategoryValue && Array.isArray(subCategories) && subCategories.length > 0) {
        // Handled by fetchProductData
      }
    }
  }, [subCategories, isEditMode, watch('sub_category_id')]);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('jwt');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/products/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const product = response.data;
      
      setValue('name', product.name);
      setValue('description', product.description || '');
      setValue('price', product.price);
      setValue('sale_price', product.sale_price || '');
      setValue('stock', product.stock);
      setValue('sku', product.sku);
      setValue('slug', product.slug);
      setValue('brand_id', product.brand_id);
      setValue('category_id', product.category_id);
      setValue('status', product.status);
      setValue('meta_title', product.meta_title || '');
      setValue('meta_description', product.meta_description || '');
      
      setTimeout(() => {
        if (product.category_id && Array.isArray(categories) && categories.length > 0) {
          const filteredSubCategories = Array.isArray(categories) ? categories.filter(cat => {
            const parentId = cat.parent_id;
            return String(parentId) === String(product.category_id);
          }) : [];
          setSubCategories(filteredSubCategories);
          
          if (product.sub_category_id && filteredSubCategories.length > 0) {
            const subcategoryExists = filteredSubCategories.some(sub => sub.id === product.sub_category_id);
            if (subcategoryExists) {
              setValue('sub_category_id', product.sub_category_id);
            } else {
              setValue('sub_category_id', '');
            }
          } else if (product.sub_category_id && filteredSubCategories.length === 0) {
            setValue('sub_category_id', '');
          }
        }
      }, 200);
      
      setTimeout(() => {
        if (product.sub_category_id) {
          const currentValue = watch('sub_category_id');
          if (!currentValue) {
            setValue('sub_category_id', product.sub_category_id);
            setForceRender(prev => prev + 1);
          }
        }
      }, 500);
      
      if (product.photo) {
        const imageUrl = API_CONFIG.getImageUrl(product.photo);
        setExistingImage(imageUrl);
        setImagePreview(imageUrl);
      }
      
      if (product.images && product.images.length > 0) {
        const imageUrls = product.images.map(img => API_CONFIG.getImageUrl(img));
        setExistingImages(imageUrls);
      } else {
        setExistingImages([]);
      }
      
      setTimeout(() => {
        setForceRender(prev => prev + 1);
      }, 300);
    } catch (error) {
      toast.error('Failed to fetch product data');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

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

  const handleMultipleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Must be less than 5MB`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} is not an image`);
        return false;
      }
      return true;
    });
    
    setMultipleImages(prev => [...prev, ...validFiles]);
  };

  const removeImage = (index) => {
    setMultipleImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (index) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('jwt');
      await axios.put(`${API_CONFIG.BASE_URL}/api/products/${id}/images`, {
        action: 'remove',
        imageIndex: index
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setExistingImages(prev => prev.filter((_, i) => i !== index));
      toast.success('Image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    }
  };

  const reorderImages = (fromIndex, toIndex) => {
    const newOrder = [...existingImages];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    setExistingImages(newOrder);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('jwt');
      
      if (!token) {
        toast.error('Authentication required. Please log in again.');
        navigate('/auth/sign-in');
        return;
      }
      
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description || '');
      formData.append('price', data.price);
      formData.append('sale_price', data.sale_price || '');
      formData.append('stock', data.stock);
      formData.append('sku', data.sku);
      formData.append('slug', data.slug);
      formData.append('brand_id', data.brand_id);
      formData.append('category_id', data.category_id);
      if (data.sub_category_id) {
        formData.append('sub_category_id', data.sub_category_id);
      }
      formData.append('status', data.status);
      formData.append('meta_title', data.meta_title || '');
      formData.append('meta_description', data.meta_description || '');
      
      if (data.photo) {
        formData.append('product_image', data.photo);
      }

      if (multipleImages.length > 0) {
        multipleImages.forEach((file, index) => {
          formData.append('multiple_images', file);
        });
      }

      if (isEditMode) {
        const updateUrl = multipleImages.length > 0 
          ? `${API_CONFIG.BASE_URL}/api/products/update_product_with_images/${id}`
          : `${API_CONFIG.BASE_URL}/api/products/update_product_by_id/${id}`;
          
        await axios.put(updateUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
        });
        toast.success('Product updated successfully');
      } else {
        await axios.post(`${API_CONFIG.BASE_URL}/api/products/save_product`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
        });
        toast.success('Product created successfully');
      }
      
      navigate('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
        navigate('/auth/sign-in');
        return;
      }
      
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Validation error. Please check your input.';
        toast.error(errorMessage);
        return;
      }
      
      if (error.response?.status === 500 && error.response?.data?.error?.includes('E11000')) {
        if (error.response?.data?.error?.includes('slug')) {
          toast.error('A product with this slug already exists. Please use a different slug.');
        } else if (error.response?.data?.error?.includes('sku')) {
          toast.error('A product with this SKU already exists. Please use a different SKU.');
        } else {
          toast.error('A product with this information already exists. Please check your input.');
        }
        return;
      }
      
      const errorMessage = error.response?.data?.message || 'Failed to save product. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/products');
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
      
      <div className="flex items-center mb-6">
        <button
          onClick={handleBack}
          className="mr-4 p-2 text-gray-600 hover:text-gray-800"
        >
          <FaArrowLeft className="text-lg" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'Edit Product' : 'Add New Product'}
        </h1>
      </div>

      <div className="max-w-4xl">
        <form key={`product-form-${forceRender}`} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                {...register('name')}
                maxLength={50}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter product name"
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                }}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Code <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                {...register('sku')}
                maxLength={10}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.sku ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter Product Code"
              />
              {errors.sku && (
                <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                maxLength={12}
                {...register('price')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
                onInput={(e) => {
                  if (e.target.value.replace('.', '').length > 12) {
                    e.target.value = e.target.value.slice(0, 12);
                  }
                }}
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sale Price
              </label>
              <input
                type="number"
                step="0.01"
                maxLength={12}
                {...register('sale_price')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.sale_price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
                onInput={(e) => {
                  if (e.target.value.replace('.', '').length > 12) {
                    e.target.value = e.target.value.slice(0, 12);
                  }
                }}
              />
              {errors.sale_price && (
                <p className="mt-1 text-sm text-red-600">{errors.sale_price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                maxLength={3}
                {...register('stock')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.stock ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
                onInput={(e) => {
                  if (e.target.value.length > 3) {
                    e.target.value = e.target.value.slice(0, 3);
                  }
                }}
              />
              {errors.stock && (
                <p className="mt-1 text-sm text-red-600">{errors.stock.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Code <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                {...register('slug')}
                maxLength={10}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.slug ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter Category Code"
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand <span className="text-red-600">*</span>
              </label>
              <select
                {...register('brand_id')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.brand_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a brand</option>
                {Array.isArray(brands) && brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.brand_name}
                  </option>
                ))}
              </select>
              {errors.brand_id && (
                <p className="mt-1 text-sm text-red-600">{errors.brand_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-600">*</span>
              </label>
              <select
                {...register('category_id')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.category_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a category</option>
                {Array.isArray(categories) && categories.filter(cat => !cat.parent_id).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategory
              </label>
              <select
                {...register('sub_category_id')}
                key={`subcategory-${Array.isArray(subCategories) ? subCategories.length : 0}-${forceRender}`}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.sub_category_id ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={!selectedCategory}
              >
                {Array.isArray(subCategories) && subCategories.length > 0 ? (
                  <option value="">Select a subcategory</option>
                ) : (
                  <option value="">No subcategories available</option>
                )}
                {Array.isArray(subCategories) && subCategories.map((subCategory) => (
                  <option wikth="300px" key={subCategory.id} value={subCategory.id}>
                    {subCategory.name}
                  </option>
                ))}
              </select>
              {errors.sub_category_id && (
                <p className="mt-1 text-sm text-red-600">{errors.sub_category_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-600">*</span>
              </label>
              <select
                {...register('status')}
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter product description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              {...register('meta_title')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.meta_title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter the title"
            />
            {errors.meta_title && (
              <p className="mt-1 text-sm text-red-600">{errors.meta_title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('meta_description')}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.meta_description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter the description"
            />
            {errors.meta_description && (
              <p className="mt-1 text-sm text-red-600">{errors.meta_description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Image
            </label>
            <div className="space-y-4">
              {(imagePreview || existingImage) && (
                <div className="flex items-center space-x-4">
                  <img
                    src={imagePreview || existingImage}
                    alt="Product preview"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setExistingImage(null);
                      setValue('photo', null);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              )}
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                  <FaUpload className="inline mr-2" />
                  {isEditMode ? 'Change Image' : 'Upload Image'}
                </button>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  ref={fileInputRef}
                />
                <span className="text-sm text-gray-500">
                  {isEditMode ? 'Leave empty to keep current image' : 'Select an image file (max 5MB)'}
                </span>
              </div>
              {errors.photo && (
                <p className="mt-1 text-sm text-red-600">{errors.photo.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Product Images
            </label>
            <div className="space-y-4">
              {existingImages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Current Images:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {existingImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Product image ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-lg border cursor-move"
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('text/plain', index)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                            reorderImages(fromIndex, index);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {multipleImages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">New Images to Upload:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {multipleImages.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New image ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
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
                  className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  onClick={() => multipleImagesInputRef.current && multipleImagesInputRef.current.click()}
                >
                  <FaUpload className="inline mr-2" />
                  Add More Images
                </button>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultipleImagesChange}
                  className="hidden"
                  ref={multipleImagesInputRef}
                />
                <span className="text-sm text-gray-500">
                  Select multiple image files (max 5MB each)
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading && <FaSpinner className="animate-spin mr-2" />}
              {isEditMode ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;