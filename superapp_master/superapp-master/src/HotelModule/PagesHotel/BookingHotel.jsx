import API_CONFIG from "../../config/api.config.js";
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import HotelCalendar from "../ComponentsHotel/HotelCalendar";
import { ArrowLeftIcon } from "@heroicons/react/24/outline"; // Import the back arrow icon

const BookingPage = () => {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [special, setSpecial] = useState("");
  const [error, setError] = useState("");
  const [contactError, setContactError] = useState("");
  const [nameError, setNameError] = useState("");
  const [dateError, setDateError] = useState("");
  const [guestError, setGuestError] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
  const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);

  const hotel = location.state?.hotel;
  const room = location.state?.room;

  useEffect(() => {
    if (!hotel || !room) {
      setError("Missing hotel or room information.");
      navigate("/hotels"); // or another fallback
    }
    
    // Load saved addresses from multiple sources
    loadAddresses();

    // Auto-fill user details from profile
    loadUserDetails();
    
    // Auto-fill search data from home page
    loadSearchData();
    
    // Listen for address updates from other modules
    const handleAddressUpdate = () => {
      loadAddresses();
    };
    
    window.addEventListener('addressUpdated', handleAddressUpdate);
    window.addEventListener('focus', handleAddressUpdate);
    
    return () => {
      window.removeEventListener('addressUpdated', handleAddressUpdate);
      window.removeEventListener('focus', handleAddressUpdate);
    };
  }, [hotel, room, navigate, selectedAddress]);

  // Function to load addresses from multiple sources
  const loadAddresses = () => {
    try {
      let allAddresses = [];
      
      // 1. Load from hotelUserAddresses (hotel-specific addresses)
      const hotelAddresses = JSON.parse(localStorage.getItem('hotelUserAddresses') || '[]');
      allAddresses = [...hotelAddresses];
      
      // 2. Load from delivery_address (unified address from profile)
      const deliveryAddress = localStorage.getItem('delivery_address');
      if (deliveryAddress) {
        try {
          const addressData = JSON.parse(deliveryAddress);
          const unifiedAddress = {
            fullName: addressData.fullName || '',
            phone: addressData.phone || '',
            contactNumber: addressData.phone || '', // For backward compatibility
            address: addressData.address_line1 || '',
            houseNo: addressData.address_line1 || '', // For backward compatibility
            landmark: addressData.landmark || addressData.address_line2 || '',
            roadName: addressData.landmark || addressData.address_line2 || '', // For backward compatibility
            city: addressData.city || '',
            state: addressData.state || '',
            pincode: addressData.pincode || '',
            country: addressData.country || 'India',
            addressType: addressData.type || 'Home',
            selectedAddressType: addressData.type || 'Home', // For backward compatibility
            isFromProfile: true
          };
          
          // Check if this address already exists to avoid duplicates
          const addressExists = allAddresses.some(addr => 
            (addr.address === unifiedAddress.address || addr.houseNo === unifiedAddress.houseNo) && 
            addr.city === unifiedAddress.city && 
            addr.pincode === unifiedAddress.pincode
          );
          
          if (!addressExists) {
            allAddresses.unshift(unifiedAddress); // Add to beginning
          }
        } catch (error) {
          console.log('ℹ️ Could not parse delivery_address:', error);
        }
      }
      
      // 3. Load from userProfile as fallback
      const userProfile = localStorage.getItem('userProfile');
      if (userProfile && allAddresses.length === 0) {
        try {
          const profile = JSON.parse(userProfile);
          if (profile.addressLine1 || profile.city || profile.state) {
            const profileAddress = {
              fullName: profile.fullName || 'User',
              phone: profile.phone || '',
              contactNumber: profile.phone || '', // For backward compatibility
              address: profile.addressLine1 || '',
              houseNo: profile.addressLine1 || '', // For backward compatibility
              landmark: profile.addressLine2 || '',
              roadName: profile.addressLine2 || '', // For backward compatibility
              city: profile.city || '',
              state: profile.state || '',
              pincode: profile.pincode || '',
              country: profile.country || 'India',
              addressType: 'Home',
              selectedAddressType: 'Home', // For backward compatibility
              isFromProfile: true
            };
            allAddresses.push(profileAddress);
          }
        } catch (error) {
          console.log('ℹ️ Could not parse userProfile:', error);
        }
      }
      
      console.log('📍 Loaded addresses for hotel:', allAddresses);
      setAddresses(allAddresses);
      
      // Auto-select first address if available
      if (allAddresses.length > 0 && !selectedAddress) {
        setSelectedAddress(allAddresses[0]);
        console.log('📍 Auto-selected address:', allAddresses[0]);
      }
    } catch (error) {
      console.log('ℹ️ Could not load addresses, using empty array:', error);
      setAddresses([]);
    }
  };

  // Function to load user details from profile service
  const loadUserDetails = () => {
    try {
      // Import profileService dynamically to avoid circular imports
      import('../../services/profileService').then(({ profileService }) => {
        const userProfile = profileService.getProfile();
        
        if (userProfile) {
          // Auto-fill name if available
          if (userProfile.fullName && !name) {
            setName(userProfile.fullName);
          }
          
          // Auto-fill contact if available
          if (userProfile.phone && !contact) {
            setContact(userProfile.phone);
          }
          
          console.log('✅ User details auto-filled from profile:', {
            name: userProfile.fullName,
            phone: userProfile.phone
          });
        }
      }).catch(error => {
        console.log('ℹ️ Profile service not available, using manual entry');
      });
    } catch (error) {
      console.log('ℹ️ Could not load user profile, using manual entry');
    }
  };

  // Function to load search data from home page
  const loadSearchData = () => {
    try {
      const savedSearchData = localStorage.getItem('hotelSearchData');
      if (savedSearchData) {
        const searchData = JSON.parse(savedSearchData);
        
        // Check if data is recent (within 24 hours)
        const isRecent = Date.now() - searchData.timestamp < 24 * 60 * 60 * 1000;
        
        if (isRecent) {
          // Auto-fill dates if available
          if (searchData.checkInDate && !checkIn) {
            setCheckIn(searchData.checkInDate);
          }
          
          if (searchData.checkOutDate && !checkOut) {
            setCheckOut(searchData.checkOutDate);
          }
          
          // Parse rooms and guests from roomsGuests string
          if (searchData.roomsGuests) {
            console.log('🔍 Loading search data - roomsGuests:', searchData.roomsGuests);
            const parsedGuests = parseRoomsGuests(searchData.roomsGuests);
            if (parsedGuests) {
              console.log('🔍 Setting adults from parsed data:', parsedGuests.adults);
            console.log('🔍 Current adults state:', adults);
              if (parsedGuests.adults !== undefined) {
                console.log('🔍 Updating adults to:', parsedGuests.adults);
                setAdults(parsedGuests.adults);
              }
              if (parsedGuests.children !== undefined) {
                setChildren(parsedGuests.children);
              }
              if (parsedGuests.infants !== undefined) {
                setInfants(parsedGuests.infants);
              }
              if (parsedGuests.rooms !== undefined) {
                setRooms(parsedGuests.rooms);
              }
            }
          }
          
          console.log('✅ Search data auto-filled from home page:', {
            checkIn: searchData.checkInDate,
            checkOut: searchData.checkOutDate,
            adults: parsedGuests?.adults,
            children: parsedGuests?.children,
            infants: parsedGuests?.infants,
            rooms: parsedGuests?.rooms
          });
        }
      }
    } catch (error) {
      console.log('ℹ️ Could not load search data, using manual entry');
    }
  };

  // Function to parse rooms and guests string
  const parseRoomsGuests = (roomsGuestsString) => {
    try {
      // Example: "2 Rooms, 2 Adults, 1 Child, 1 Infant" or "1 Room, 1 Adult"
      const roomsMatch = roomsGuestsString.match(/(\d+)\s*Room/i);
      const adultsMatch = roomsGuestsString.match(/(\d+)\s*Adult/i); // This matches both "Adult" and "Adults"
      const childrenMatch = roomsGuestsString.match(/(\d+)\s*Child/i); // This matches both "Child" and "Children"
      const infantsMatch = roomsGuestsString.match(/(\d+)\s*Infant/i); // This matches both "Infant" and "Infants"
      
      console.log('🔍 Parsing roomsGuestsString:', roomsGuestsString);
      console.log('🔍 Regex matches:', { roomsMatch, adultsMatch, childrenMatch, infantsMatch });
      
      const result = {
        rooms: roomsMatch ? parseInt(roomsMatch[1]) : 1,
        adults: adultsMatch ? parseInt(adultsMatch[1]) : 1,
        children: childrenMatch ? parseInt(childrenMatch[1]) : 0,
        infants: infantsMatch ? parseInt(infantsMatch[1]) : 0
      };
      
      console.log('✅ Parsed result:', result);
      return result;
    } catch (error) {
      console.log('ℹ️ Could not parse rooms and guests data:', error);
      return null;
    }
  };

  const hotelId = hotel?._id;
  const roomId = room?._id;
  const pricePerNight = room?.price_per_night || 0;

  const getDays = () => {
    if (!checkIn || !checkOut) return 0;
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    const diff = (outDate - inDate) / (1000 * 60 * 60 * 24);
    return diff > 0 ? diff : 0;
  };


  const days = getDays();
  const totalAmount = (rooms || 1) * days * pricePerNight;

  const handleContactChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setContact(value);
      setContactError("");
      if (error) setError("");
      
      // Save contact to profile for future use
      saveUserDetails({ phone: value });
    }
  };

  // Function to save user details to profile
  const saveUserDetails = (details) => {
    try {
      import('../../services/profileService').then(({ profileService }) => {
        const currentProfile = profileService.getProfile();
        const updatedProfile = { ...currentProfile, ...details };
        profileService.saveProfile(updatedProfile);
        console.log('✅ User details saved to profile:', details);
      }).catch(error => {
        console.log('ℹ️ Could not save to profile service');
      });
    } catch (error) {
      console.log('ℹ️ Could not save user details');
    }
  };

  // Enhanced contact number validation
  const validateContactNumber = (phoneNumber) => {
    if (!phoneNumber) {
      return "Contact number is required";
    }
    if (phoneNumber.length !== 10) {
      return "Contact number must be exactly 10 digits";
    }
    if (!/^[6-9]/.test(phoneNumber)) {
      return "Contact number must start with 6, 7, 8, or 9";
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      return "Contact number must contain only digits";
    }
    return "";
  };

  // Name validation
  const validateName = (fullName) => {
    if (!fullName) {
      return "Full name is required";
    }
    if (fullName.trim().length < 2) {
      return "Name must be at least 2 characters long";
    }
    if (fullName.trim().length > 50) {
      return "Name must be less than 50 characters";
    }
    if (!/^[a-zA-Z\s]+$/.test(fullName.trim())) {
      return "Name can only contain letters and spaces";
    }
    return "";
  };

  // Date validation
  const validateDates = (checkInDate, checkOutDate) => {
    if (!checkInDate) {
      return "Check-in date is required";
    }
    if (!checkOutDate) {
      return "Check-out date is required";
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const inDate = new Date(checkInDate);
    const outDate = new Date(checkOutDate);
    
    if (inDate < today) {
      return "Check-in date cannot be in the past";
    }
    if (outDate <= inDate) {
      return "Check-out date must be after check-in date";
    }
    return "";
  };

  // Guest validation
  const validateGuests = (adultsCount, childrenCount, infantsCount = 0) => {
    if (adultsCount < 1) {
      return "At least 1 adult is required";
    }
    if (adultsCount > 10) {
      return "Maximum 10 adults allowed";
    }
    if (childrenCount < 0) {
      return "Children count cannot be negative";
    }
    if (childrenCount > 10) {
      return "Maximum 10 children allowed";
    }
    if (infantsCount < 0) {
      return "Infants count cannot be negative";
    }
    if (infantsCount > 10) {
      return "Maximum 10 infants allowed";
    }
    if (adultsCount + childrenCount + infantsCount > 12) {
      return "Total guests cannot exceed 12";
    }
    return "";
  };

  // Room validation
  const validateRooms = (roomCount, adultsCount) => {
    if (roomCount === "" || roomCount < 1) {
      return "At least 1 room is required";
    }
    if (roomCount > 5) {
      return "Maximum 5 rooms allowed";
    }
    if (roomCount > adultsCount) {
      return "Number of rooms cannot exceed number of adults";
    }
    return "";
  };

  const handleGuestChange = (setter, value, min) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= min) {
      // Special handling for adults - ensure minimum is 1
      if (setter === setAdults && num < 1) {
        setter(1);
      } else {
        setter(num);
      }
    } else if (value === "") {
      // Special handling for adults - don't allow empty value
      if (setter === setAdults) {
        setter(1);
      } else {
        setter("");
      }
    }
  };

  const handleBack = () => {
    navigate(-1); // Go back to the previous page
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setShowAddressModal(false);
  };

  const handleAddNewAddress = () => {
    navigate('/hotel-address-form', { 
      state: { returnTo: '/hotel-booking', returnState: location.state }
    });
  };

  const handleConfirm = async () => {
    const guests = parseInt(adults, 10) + parseInt(children, 10) + parseInt(infants, 10);

    if (!hotelId || !roomId) {
      setError("Hotel or room ID missing.");
      return;
    }

    // Validate all fields
    const nameValidationError = validateName(name);
    const contactValidationError = validateContactNumber(contact);
    const dateValidationError = validateDates(checkIn, checkOut);
    const guestValidationError = validateGuests(adults, children, infants);
    const roomValidationError = validateRooms(rooms, adults);

    // Set individual field errors
    setNameError(nameValidationError);
    setContactError(contactValidationError);
    setDateError(dateValidationError);
    setGuestError(guestValidationError);

    // Check if any validation failed
    if (nameValidationError || contactValidationError || dateValidationError || guestValidationError || roomValidationError) {
      const firstError = nameValidationError || contactValidationError || dateValidationError || guestValidationError || roomValidationError;
      setError(firstError);
      return;
    }

    if (checkIn && checkOut && guests > 0 && name && contact && (rooms || 1) > 0 && days > 0) {
      try {
        const bookingData = {
          hotel_id: hotelId,
          room_id: roomId,
          check_in_date: checkIn,
          check_out_date: checkOut,
          guests: {
            adults: parseInt(adults, 10),
            children: parseInt(children, 10),
            infants: parseInt(infants, 10),
          },
          total_nights: days,
          rooms: rooms,
          price_per_night: pricePerNight,
          total_amount: totalAmount,
          final_amount: totalAmount,
          name: name,
          contact_number: contact,
          special_requests: special,
        };

        console.log("Booking Data =>", bookingData);

        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.BOOKINGS), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(bookingData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Booking failed");
        }

        const createdBooking = await response.json();
        console.log("Backend response:", createdBooking);
        
        // Store booking data in localStorage as backup
        const completeBookingData = {
          ...createdBooking,
          // Ensure name and contact_number are included
          name: bookingData.name,
          contact_number: bookingData.contact_number
        };
        localStorage.setItem('hotelBookingData', JSON.stringify(completeBookingData));
        
        // Pass both the original booking data and the backend response
        navigate("/hotel-payment", { 
          state: { 
            booking: completeBookingData
          } 
        });
      } catch (err) {
        setError(err.message || "Something went wrong while booking.");
      }
    } else {
      setError("Please fill all required fields and select valid dates.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center py-6 px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6">
        {/* Back button and title */}
        <div className="flex items-center mb-4">
          <button 
            onClick={handleBack}
            className="mr-2 p-1 rounded-full hover:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </button>
          <h2 className="text-2xl font-bold text-sky-600">Book Your Stay</h2>
        </div>

        <div className="space-y-4">
          
          {/* Check-in Date */}
          <div>
            <label>Check-in Date</label>
            <div 
              onClick={() => setShowCheckInCalendar(true)} 
              className={`border p-2 rounded cursor-pointer ${
                dateError ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-100'
              }`}
            >
              {checkIn || "Select date"}
            </div>
            {dateError && (
              <p className="text-red-500 text-sm mt-1">{dateError}</p>
            )}
            {showCheckInCalendar && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded shadow p-4">
                  <HotelCalendar
                    onClose={() => setShowCheckInCalendar(false)}
                    onSelectDate={(date) => {
                      setCheckIn(date);
                      // Reset check-out date if it's before or equal to new check-in date
                      if (checkOut && new Date(checkOut) <= new Date(date)) {
                        setCheckOut("");
                      }
                      setDateError("");
                      if (error) setError("");
                      setShowCheckInCalendar(false);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Check-out Date */}
          <div>
            <label>Check-out Date</label>
            <div 
              onClick={() => setShowCheckOutCalendar(true)} 
              className={`border p-2 rounded cursor-pointer ${
                dateError ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-100'
              }`}
            >
              {checkOut || "Select date"}
            </div>
            {showCheckOutCalendar && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded shadow p-4">
                  <HotelCalendar
                    onClose={() => setShowCheckOutCalendar(false)}
                    onSelectDate={(date) => {
                      // Only allow dates after check-in date
                      if (checkIn && new Date(date) > new Date(checkIn)) {
                        setCheckOut(date);
                        setDateError("");
                        if (error) setError("");
                        setShowCheckOutCalendar(false);
                      }
                    }}
                    minDate={checkIn ? new Date(checkIn) : null}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Guests and Rooms */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label>Adults</label>
              <input
                type="number"
                value={adults}
                min="1"
                max="10"
                onChange={(e) => {
                  handleGuestChange(setAdults, e.target.value, 1);
                  setGuestError("");
                  if (error) setError("");
                }}
                onBlur={() => {
                  const validationError = validateGuests(adults, children, infants);
                  setGuestError(validationError);
                }}
                className={`w-full p-2 border rounded ${
                  guestError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            <div className="flex-1">
              <label>Children</label>
              <input
                type="number"
                value={children}
                min="0"
                max="10"
                onChange={(e) => {
                  handleGuestChange(setChildren, e.target.value, 0);
                  setGuestError("");
                  if (error) setError("");
                }}
                onBlur={() => {
                  const validationError = validateGuests(adults, children, infants);
                  setGuestError(validationError);
                }}
                className={`w-full p-2 border rounded ${
                  guestError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            <div className="flex-1">
              <label>Infants</label>
              <input
                type="number"
                value={infants}
                min="0"
                max="10"
                onChange={(e) => {
                  handleGuestChange(setInfants, e.target.value, 0);
                  setGuestError("");
                  if (error) setError("");
                }}
                onBlur={() => {
                  const validationError = validateGuests(adults, children, infants);
                  setGuestError(validationError);
                }}
                className={`w-full p-2 border rounded ${
                  guestError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            <div className="flex-1">
              <label>Rooms</label>
              <input
                type="number"
                value={rooms}
                min="1"
                max="5"
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value) && value >= 1 && value <= 5) {
                    setRooms(value);
                  } else if (e.target.value === "") {
                    setRooms("");
                  }
                  setGuestError("");
                  if (error) setError("");
                }}
                onBlur={() => {
                  // Ensure minimum value of 1 on blur
                  if (rooms === "" || rooms < 1) {
                    setRooms(1);
                  }
                  const validationError = validateRooms(rooms, adults);
                  setGuestError(validationError);
                }}
                className={`w-full p-2 border rounded ${
                  guestError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
          </div>
          {guestError && (
            <p className="text-red-500 text-sm mt-1">{guestError}</p>
          )}

          {/* Contact Info */}
          <div>
            <label>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError("");
                if (error) setError("");
              }}
              onBlur={() => {
                const validationError = validateName(name);
                setNameError(validationError);
                
                // Save name to profile for future use
                if (name && !validationError) {
                  saveUserDetails({ fullName: name });
                }
              }}
              placeholder="Enter your full name"
              className={`w-full p-2 border rounded ${
                nameError ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {nameError && (
              <p className="text-red-500 text-sm mt-1">{nameError}</p>
            )}
          </div>

          <div>
            <label>Contact Number</label>
            <input
              type="tel"
              value={contact}
              onChange={handleContactChange}
              onBlur={() => {
                const validationError = validateContactNumber(contact);
                setContactError(validationError);
              }}
              maxLength={10}
              placeholder="Enter 10-digit mobile number"
              className={`w-full p-2 border rounded ${
                contactError ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {contactError && (
              <p className="text-red-500 text-sm mt-1">{contactError}</p>
            )}
          </div>

          {/* Address Selection */}
          <div>
            <label>Billing Address</label>
            {selectedAddress ? (
              <div className="border border-gray-300 rounded p-3 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-800">{selectedAddress.fullName}</span>
                      <span className="bg-sky-100 text-sky-700 px-2 py-1 rounded-full text-xs font-medium">
                        {selectedAddress.selectedAddressType}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{selectedAddress.contactNumber}</p>
                    <p className="text-sm text-gray-600">
                      {selectedAddress.houseNo}, {selectedAddress.roadName}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="text-sky-600 text-sm font-medium hover:text-sky-700"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="border border-gray-300 rounded p-3 text-center text-gray-500">
                  No address selected
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200 transition-colors"
                  >
                    Select Address
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewAddress}
                    className="flex-1 bg-sky-600 text-white py-2 px-4 rounded hover:bg-sky-700 transition-colors"
                  >
                    Add New
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Special Requests */}
          <div>
            <label>Special Requests</label>
            <textarea
              value={special}
              onChange={(e) => setSpecial(e.target.value)}
              rows="3"
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Booking Summary */}
          <div className="bg-sky-50 p-4 rounded text-center">
            <div>Rooms: <strong>{rooms}</strong> | Days: <strong>{days}</strong> | Rate: ₹<strong>{pricePerNight}</strong></div>
            <div className="mt-2 font-bold text-sky-700">Total: ₹{isNaN(totalAmount) ? 0 : totalAmount}</div>
          </div>

          {/* Error Message */}
          {error && <p className="text-red-500 text-center text-sm">{error}</p>}

          {/* Submit Button */}
          <button
            onClick={handleConfirm}
            className="w-full bg-sky-600 text-white py-3 rounded-lg font-semibold hover:bg-sky-700 transition"
          >
            Confirm & Pay
          </button>
        </div>
      </div>

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Select Address</h3>
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No addresses found</p>
                  <button
                    onClick={handleAddNewAddress}
                    className="bg-sky-600 text-white px-4 py-2 rounded hover:bg-sky-700 transition-colors"
                  >
                    Add New Address
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address, index) => (
                    <div
                      key={index}
                      onClick={() => handleAddressSelect(address)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedAddress === address
                          ? 'border-sky-500 bg-sky-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">{address.fullName}</span>
                        <span className="bg-sky-100 text-sky-700 px-2 py-1 rounded-full text-xs font-medium">
                          {address.selectedAddressType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{address.contactNumber}</p>
                      <p className="text-sm text-gray-600">
                        {address.houseNo}, {address.roadName}, {address.city}, {address.state} - {address.pincode}
                      </p>
                    </div>
                  ))}
                  
                  <button
                    onClick={handleAddNewAddress}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-sky-400 hover:text-sky-600 transition-colors"
                  >
                    + Add New Address
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;