import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_CONFIG from '../../../config/api.config';
import { authService } from '../../../services/authService';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import 'react-toastify/dist/ReactToastify.css';
import { toast, ToastContainer } from 'react-toastify';
import Navbar from 'components/navbar';

function Profile() {
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState(null);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(
      // Make fields optional so the Save button is always clickable
      Yup.object({
        email: Yup.string().email('Invalid email address').nullable(),
        mobile_number: Yup.string().matches(/^\d{10}$/,'Mobile number must be exactly 10 digits').nullable(),
        facebook: Yup.string().url('Invalid URL').nullable(),
        instagram: Yup.string().url('Invalid URL').nullable(),
        linkedin: Yup.string().url('Invalid URL').nullable(),
        pintrest: Yup.string().url('Invalid URL').nullable(),
        youtube: Yup.string().url('Invalid URL').nullable(),
        twitter: Yup.string().url('Invalid URL').nullable(),
      })
    ),
    defaultValues: {
      logo: null,
      business_name: '',
      name: '',
      email: '',
      mobile_number: '',
      district_city: '',
      state: '',
      country: '',
      pincode: '',
      gst_number: '',
      facebook: '',
      instagram: '',
      linkedin: '',
      pintrest: '',
      youtube: '',
      twitter: '',
    },
  });


  const [profileId, setProfileId] = useState('');


  const fetchData = async () => {
    try {
      const token = authService.getToken() ||
        localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN) ||
        localStorage.getItem('OnlineShop-accessToken');
      const response = await axios.get(
        API_CONFIG.getUrl('/api/auth/profile'),
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      console.log('API Response:', response.data);

      const payload = response.data?.data || response.data;
      const data = Array.isArray(payload) ? payload[0] : payload;

      if (data) {
        setProfileId(data.id);

        setValue('logo', '');
        setValue('business_name', '');
        setValue('name', data.name || '');
        setValue('email', data.email || '');
        setValue('mobile_number', data.phone || '');
        setValue('district_city', '');
        setValue('state', '');
        setValue('country', '');
        setValue('pincode', '');
        setValue('gst_number', '');
        setValue('facebook', '');
        setValue('instagram', '');
        setValue('linkedin', '');
        setValue('pintrest', '');
        setValue('youtube', '');
        setValue('twitter', '');

        setImagePreview(null);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setLoading(false);
    }
  };

  const onUpdate = async (data) => {
    if (!profileId) {
      console.error('Profile ID is not available');
      return;
    }

    setIsSubmitting(true);

    const accessToken = authService.getToken() ||
      localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN) ||
      localStorage.getItem('OnlineShop-accessToken');
    if (!accessToken) {
      toast.error('Your session has expired. Please sign in again.');
      return;
    }

    // Prepare minimal payload supported by backend
    const payload = {
      name: data.name,
      phone: data.mobile_number
    };

    try {
      const response = await axios.put(
        API_CONFIG.getUrl('/api/auth/profile'),
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 200) {
        console.log('Profile updated successfully:', response.data);
        // Show success toast message
        toast.success('Profile updated successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else {
        console.error('Profile update failed with response:', response);
        // Show error toast message
        toast.error('Failed to update profile. Please try again.', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      // Show error toast message
      toast.error('An error occurred while updating the profile. Please try again.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setIsSubmitting(false); // Reset the submitting state
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [imagePreview, setImagePreview] = useState(null);

  const handleDrop = (files) => {
    if (files && files[0]) {
      const file = files[0];
      setLogoFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <>  <Navbar brandText={"Profile"} />
      <div className="min-h-screen flex justify-center items-center">

        {/* Form Section */}
        <ToastContainer />
        <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-8xl mt-10">
          <form onSubmit={handleSubmit(onUpdate)} className="space-y-6">

            <h1 className="text-3xl font-semibold text-center mb-8">Edit Profile</h1>

            {/* Profile Image Section */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                {/* Label Above the Image */}
                <label htmlFor="logo" className="block text-center mb-2 font-semibold text-gray-600">
                  Logo
                </label>

                {/* Hidden File Input */}
                <input
                  name="logo"
                  type="file"
                  id="logo"  // Added for label targeting
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => handleDrop(e.target.files)}
                />

                {/* Image Preview */}
                <div className="w-32 h-32 rounded-full border-4 border-gray-300 flex items-center justify-center bg-gray-200 text-gray-400">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile Preview"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="flex items-center text-2xl">
                      <span role="img" aria-label="camera" className="mr-1">📷</span>
                      <span className="text-red-500" aria-hidden="true">*</span>
                    </span>
                  )}
                </div>
              </div>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Business Name */}
              <div>
                <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">
                  Business Name <span className="text-red-500 ">*</span>
                </label>
                <Controller
                  name="business_name"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      id="business_name"
                      className="mt-2 block w-full px-6 py-4 text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter Business Name"
                    />
                  )}
                />{errors.business_name && (
                  <p className="text-red-500 text-sm">{errors.business_name.message}</p>
                )}
              </div>


              {/* Full Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500 ">*</span>
                </label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      id="name"
                      className="mt-2 block w-full px-6 py-4 text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter Full Name"
                    />
                  )}
                />{errors.name && (
                  <p className="text-red-500 text-sm">{errors.name.message}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500 ">*</span>
                </label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="email"
                      id="email"
                      className="mt-2 block w-full px-6 py-4 text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter Email Address"
                    />
                  )}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email.message}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
                  Mobile Number <span className="text-red-500 ">*</span>
                </label>
                <Controller
                  name="mobile_number"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      id="mobile"
                      className="mt-2 block w-full px-6 py-4 text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter Mobile Number"
                    />
                  )}
                />
                {errors.mobile_number && (
                  <p className="text-red-500 text-sm">{errors.mobile_number.message}</p>
                )}
              </div>

              {/* District/City */}
              <div>
                <label htmlFor="district_city" className="block text-sm font-medium text-gray-700">
                  District/City <span className="text-red-500 ">*</span>
                </label>
                <Controller
                  name="district_city"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      id="district_city"
                      className="mt-2 block w-full px-6 py-4 text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter District/City"
                    />
                  )}
                /> {errors.district_city && (
                  <p className="text-red-500 text-sm">{errors.district_city.message}</p>
                )}
              </div>

              {/* State */}
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State <span className="text-red-500 ">*</span>
                </label>
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      id="state"
                      className="mt-2 block w-full px-6 py-4 text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter State"
                    />
                  )}
                />
                {errors.state && (
                  <p className="text-red-500 text-sm">{errors.state.message}</p>
                )}
              </div>

              {/* Country */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country <span className="text-red-500 ">*</span>
                </label>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      id="country"
                      className="mt-2 block w-full px-6 py-4 text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter Country"
                    />
                  )}
                />
                {errors.country && (
                  <p className="text-red-500 text-sm">{errors.country.message}</p>
                )}
              </div>

              {/* Pincode */}
              <div>
                <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                  Pincode <span className="text-red-500 ">*</span>
                </label>
                <Controller
                  name="pincode"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      id="pincode"
                      className="mt-2 block w-full px-6 py-4 text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter Pincode"
                    />
                  )}
                />
                {errors.pincode && (
                  <p className="text-red-500 text-sm">{errors.pincode.message}</p>
                )}
              </div>

              {/* GST Number */}
              <div>
                <label htmlFor="gst_number" className="block text-sm font-medium text-gray-700">
                  GST Number
                </label>
                <Controller
                  name="gst_number"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      id="gst_number"
                      className="mt-2 block w-full px-6 py-4 text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter GST Number"
                    />
                  )}
                />
              </div>

              {/* Social Media Fields */}
              <div>
                <label htmlFor="facebook" className="block text-sm font-medium text-gray-700">
                  Facebook URL
                </label>
                <Controller
                  name="facebook"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="url"
                      id="facebook"
                      className="mt-2 block w-full px-6 py-4 text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter Facebook URL"
                    />
                  )}
                />
              </div>

              <div>
                <label htmlFor="instagram" className="block text-sm font-medium text-gray-700">
                  Instagram URL
                </label>
                <Controller
                  name="instagram"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="url"
                      id="instagram"
                      className="mt-2 block w-full px-6 py-4 text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter Instagram URL"
                    />
                  )}
                />
              </div>

              <div>
                <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700">
                  LinkedIn URL
                </label>
                <Controller
                  name="linkedin"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="url"
                      id="linkedin"
                      className="mt-2 block w-full px-6 py-4 text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter LinkedIn URL"
                    />
                  )}
                />
              </div>

              <div>
                <label htmlFor="pinterest" className="block text-sm font-medium text-gray-700">
                  Pinterest URL
                </label>
                <Controller
                  name="pintrest"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="url"
                      id="pinterest"
                      className="mt-2 block w-full px-6 py-4 text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter Pinterest URL"
                    />
                  )}
                />
              </div>

              <div>
                <label htmlFor="youtube" className="block text-sm font-medium text-gray-700">
                  YouTube URL
                </label>
                <Controller
                  name="youtube"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="url"
                      id="youtube"
                      className="mt-2 block w-full px-6 py-4 text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter YouTube URL"
                    />
                  )}
                />
              </div>

              <div>
                <label htmlFor="twitter" className="block text-sm font-medium text-gray-700">
                  Twitter URL
                </label>
                <Controller
                  name="twitter"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="url"
                      id="twitter"
                      className="mt-2 block w-full px-6 py-4 text-lg border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter Twitter URL"
                    />
                  )}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center mt-6">
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="spinner-border animate-spin border-4 border-t-4 border-white rounded-full w-6 h-6"></div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>

  );
}

export default Profile;
