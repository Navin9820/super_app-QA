import React, { useState, useEffect } from 'react';
import step1 from "../../Clothes/Images/step1.svg";
import { useNavigate } from 'react-router-dom';
import plus from "../../Icons/plus.svg";
import leftarrow from "../../Icons/arrow-left.svg";
import location from "../../Images/HomeScreen/location.svg";
import HeaderInsideFood from '../ComponentsF/HeaderInsideFood';
import FooterFood from '../ComponentsF/FooterFood';

function ChooseAddressFood() {
  const navigate = useNavigate();
  const [savedAddress, setSavedAddress] = useState(null);

  useEffect(() => {
    const address = localStorage.getItem('delivery_address');
    if (address) {
      try {
        setSavedAddress(JSON.parse(address));
      } catch (error) {
        console.error('Error parsing saved address:', error);
      }
    }
  }, []);

  const handleAddressSelect = () => {
    if (savedAddress) {
      navigate('/home-food/product-details');
    } else {
      navigate('/home-food/add-address');
    }
  };

  return (
    <div className='bg-[#F8F8F8] min-h-screen text-sm font-semibold'>
      <div className="fixed top-0 left-0 w-full bg-white shadow-md flex flex-row items-center justify-between pt-8 px-4 pb-2 z-50">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={leftarrow}
            alt="arrow"
            className="w-6 h-6 cursor-pointer flex-shrink-0"
            onClick={() => navigate('/home-food/account')}
          />
          <h1 className="text-base font-extrabold tracking-wide text-[var(--city-bell-color)] ml-1">City Bell</h1>
        </div>
        <div className="flex flex-col items-end min-w-0 relative max-w-[60vw] justify-end">
          <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0 mb-0.5">Current Location</span>
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-sm font-semibold text-black truncate max-w-[180px]">
              Manapakkam
            </span>
            <img src={location} alt="Location" className="w-4 h-4 flex-shrink-0 cursor-pointer" />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-4 pt-12 mt-12">
        <h2 className="text-base font-medium">Delivery address</h2>
        <div className="flex items-center gap-2">
          <img
            src={plus}
            alt="plus"
            className="cursor-pointer w-8 h-8"
            onClick={() => navigate('/home-food/add-address')}
          />
        </div>
      </div>

      <div className='mt-2 px-4 pb-24'>
        {savedAddress ? (
          <div
            className="bg-[#FBFBFB] border border-[#5C3FFF] rounded-[20px] p-1 flex flex-col justify-between h-full cursor-pointer"
            onClick={handleAddressSelect}
          >
            <div className="mt-2 p-2 rounded-lg">
              <div className="flex justify-between items-center w-full">
                <div>
                  {savedAddress.fullName},
                  <span className="bg-[#544C4A] px-2 py-1 rounded-full text-white font-normal text-sm ml-2">
                    {savedAddress.type}
                  </span>
                </div>
              </div>

              <div className="mt-2">
                {savedAddress.address_line1},<br />
                {savedAddress.city},<br />
                {savedAddress.state} - {savedAddress.pincode}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-300 rounded-[20px] p-4 text-center">
            <p className="text-gray-600 mb-4">No delivery address saved</p>
            <button
              onClick={() => navigate('/home-food/add-address')}
              className="bg-[#5C3FFF] text-white px-6 py-2 rounded-full hover:bg-[#4A2FE8]"
            >
              Add Address
            </button>
          </div>
        )}
      </div>

      <FooterFood />
    </div>
  );
}

export default ChooseAddressFood;