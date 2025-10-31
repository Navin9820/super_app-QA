const Hotel = require('../models/hotel');
const Room = require('../models/room');
const Policy = require('../models/policy');
const Amenity = require('../models/amenity');
const Booking = require('../models/booking');
const { processImage } = require('../utils/imageProcessor');
const path = require('path');
const fs = require('fs');

// List all hotels (with optional status filter)
exports.getAllHotels = async (req, res) => {
  try {
    console.log('GET /api/hotels - Request received');
    const status = req.query.status;
    let filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    console.log('Filter:', filter);
    
    const hotels = await Hotel.find(filter)
      .populate('policies')
      .populate('amenities')
      .populate('owner')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${hotels.length} hotels`);
    
    // Process image URLs for frontend
    const processedHotels = hotels.map(hotel => {
      const hotelObj = hotel.toObject();
      if (hotelObj.main_image && !hotelObj.main_image.startsWith('http')) {
        hotelObj.main_image = `${req.protocol}://${req.get('host')}${hotelObj.main_image}`;
      }
      return hotelObj;
    });
    
    res.json({ success: true, data: processedHotels });
  } catch (error) {
    console.error('Error in getAllHotels:', error);
    res.status(500).json({ success: false, message: 'Error fetching hotels', error: error.message });
  }
};

// Get hotel by ID (with rooms)
exports.getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id)
      .populate('rooms')
      .populate('policies')
      .populate('amenities')
      .populate('owner');
    
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    // Process image URLs for frontend
    const hotelObj = hotel.toObject();
    if (hotelObj.main_image && !hotelObj.main_image.startsWith('http')) {
      hotelObj.main_image = `${req.protocol}://${req.get('host')}${hotelObj.main_image}`;
    }

    res.json({ success: true, data: hotelObj });
  } catch (error) {
    console.error('Error fetching hotel:', error);
    res.status(500).json({ success: false, message: 'Error fetching hotel', error: error.message });
  }
};

// Create hotel
exports.createHotel = async (req, res) => {
  try {
    console.log('POST /api/hotels - Request received');
    console.log('Request body:', req.body);
    
    const { 
      name, 
      description, 
      phone, 
      email, 
      website, 
      rating, 
      total_reviews, 
      images, 
      main_image, 
      star_rating, 
      check_in_time, 
      check_out_time, 
      status, 
      owner_id 
    } = req.body;

    // Handle amenities array from FormData
    let amenities = [];
    if (req.body['amenities[]']) {
      amenities = Array.isArray(req.body['amenities[]']) ? req.body['amenities[]'] : [req.body['amenities[]']];
    } else if (req.body.amenities) {
      amenities = Array.isArray(req.body.amenities) ? req.body.amenities : [req.body.amenities];
    }

    // Handle policies array from FormData
    let policies = [];
    if (req.body['policies[]']) {
      policies = Array.isArray(req.body['policies[]']) ? req.body['policies[]'] : [req.body['policies[]']];
    } else if (req.body.policies) {
      policies = Array.isArray(req.body.policies) ? req.body.policies : [req.body.policies];
    }

    console.log('Parsed amenities:', amenities);
    console.log('Parsed policies:', policies);

    // Construct address object from individual fields or nested object
    const address = {
      street: req.body['address[street]'] || req.body.address?.street || '',
      city: req.body['address[city]'] || req.body.address?.city || '',
      state: req.body['address[state]'] || req.body.address?.state || '',
      country: req.body['address[country]'] || req.body.address?.country || '',
      postal_code: req.body['address[postal_code]'] || req.body.address?.postal_code || ''
    };
    
    console.log('Constructed address:', address);

    let mainImagePath = null;
    if (req.file) {
      const processedImage = await processImage(req.file, {
        width: 800,
        height: 800,
        quality: 85,
        format: 'jpeg'
      }, 'hotels');
      mainImagePath = `/uploads/hotels/${processedImage.filename}`;
    } else if (main_image) {
      mainImagePath = main_image;
    } else {
      return res.status(400).json({ success: false, message: 'Hotel image is required.' });
    }

    const hotel = new Hotel({
      name,
      description,
      address,
      phone,
      email,
      website,
      rating,
      total_reviews,
      amenities,
      images,
      main_image: mainImagePath,
      star_rating,
      check_in_time,
      check_out_time,
      policies,
      status: status || 'active',
      owner_id
    });
    
    await hotel.save();
    
    const createdHotel = await Hotel.findById(hotel._id)
      .populate('policies')
      .populate('amenities')
      .populate('owner');

    // Process image URL for response
    const hotelObj = createdHotel.toObject();
    if (hotelObj.main_image && !hotelObj.main_image.startsWith('http')) {
      hotelObj.main_image = `${req.protocol}://${req.get('host')}${hotelObj.main_image}`;
    }

    res.status(201).json({ success: true, data: hotelObj, message: 'Hotel created successfully' });
  } catch (error) {
    console.error('Error creating hotel:', error);
    res.status(400).json({ success: false, message: 'Error creating hotel', error: error.message });
  }
};

// Update hotel
exports.updateHotel = async (req, res) => {
  try {
    console.log('PUT /api/hotels/:id - Request received');
    console.log('Request body:', req.body);
    
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    const { 
      name, 
      description, 
      phone, 
      email, 
      website, 
      rating, 
      total_reviews, 
      images, 
      main_image, 
      star_rating, 
      check_in_time, 
      check_out_time, 
      status, 
      owner_id 
    } = req.body;

    // Handle amenities array from FormData
    let amenities = [];
    if (req.body['amenities[]']) {
      amenities = Array.isArray(req.body['amenities[]']) ? req.body['amenities[]'] : [req.body['amenities[]']];
    } else if (req.body.amenities) {
      amenities = Array.isArray(req.body.amenities) ? req.body.amenities : [req.body.amenities];
    }

    // Handle policies array from FormData
    let policies = [];
    if (req.body['policies[]']) {
      policies = Array.isArray(req.body['policies[]']) ? req.body['policies[]'] : [req.body['policies[]']];
    } else if (req.body.policies) {
      policies = Array.isArray(req.body.policies) ? req.body.policies : [req.body.policies];
    }

    // Construct address object from individual fields or nested object
    const address = {
      street: req.body['address[street]'] || req.body.address?.street || hotel.address?.street || '',
      city: req.body['address[city]'] || req.body.address?.city || hotel.address?.city || '',
      state: req.body['address[state]'] || req.body.address?.state || hotel.address?.state || '',
      country: req.body['address[country]'] || req.body.address?.country || hotel.address?.country || '',
      postal_code: req.body['address[postal_code]'] || req.body.address?.postal_code || hotel.address?.postal_code || ''
    };

    // Handle image update
    let mainImagePath = hotel.main_image; // Keep existing image by default
    if (req.file) {
      // Delete old image file if it exists and is not a data URL
      if (hotel.main_image && !hotel.main_image.startsWith('data:image/')) {
        const oldImagePath = path.join(__dirname, '..', '..', hotel.main_image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      const processedImage = await processImage(req.file, {
        width: 800,
        height: 800,
        quality: 85,
        format: 'jpeg'
      }, 'hotels');
      mainImagePath = `/uploads/hotels/${processedImage.filename}`;
    } else if (main_image) {
      mainImagePath = main_image;
    }

    // Update hotel fields
    Object.assign(hotel, {
      name: name || hotel.name,
      description: description || hotel.description,
      address: address,
      phone: phone || hotel.phone,
      email: email || hotel.email,
      website: website || hotel.website,
      rating: rating !== undefined ? rating : hotel.rating,
      total_reviews: total_reviews !== undefined ? total_reviews : hotel.total_reviews,
      amenities: amenities.length > 0 ? amenities : hotel.amenities,
      images: images || hotel.images,
      main_image: mainImagePath,
      star_rating: star_rating !== undefined ? star_rating : hotel.star_rating,
      check_in_time: check_in_time || hotel.check_in_time,
      check_out_time: check_out_time || hotel.check_out_time,
      policies: policies.length > 0 ? policies : hotel.policies,
      status: status || hotel.status,
      owner_id: owner_id || hotel.owner_id
    });

    await hotel.save();

    const updatedHotel = await Hotel.findById(hotel._id)
      .populate('policies')
      .populate('amenities')
      .populate('owner');

    // Process image URL for response
    const hotelObj = updatedHotel.toObject();
    if (hotelObj.main_image && !hotelObj.main_image.startsWith('http')) {
      hotelObj.main_image = `${req.protocol}://${req.get('host')}${hotelObj.main_image}`;
    }

    res.json({ success: true, data: hotelObj, message: 'Hotel updated successfully' });
  } catch (error) {
    console.error('Error updating hotel:', error);
    res.status(400).json({ success: false, message: 'Error updating hotel', error: error.message });
  }
};

// Delete hotel
exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    // Delete associated image files
    if (hotel.main_image && !hotel.main_image.startsWith('data:image/')) {
      const imagePath = path.join(__dirname, '..', '..', hotel.main_image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete associated rooms
    await Room.deleteMany({ hotel_id: hotel._id });

    // Delete hotel
    await Hotel.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Hotel deleted successfully' });
  } catch (error) {
    console.error('Error deleting hotel:', error);
    res.status(500).json({ success: false, message: 'Error deleting hotel', error: error.message });
  }
};

// Create room for hotel
exports.createRoomForHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.hotelId);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    const { 
      room_type, 
      room_number, 
      price, 
      capacity, 
      amenities, 
      description,
      // Handle frontend field names
      name,
      type,
      price_per_night
    } = req.body;
    
    // Map frontend field names to backend field names
    const finalRoomType = type || room_type;
    const finalRoomNumber = name || room_number;
    const finalPrice = price_per_night || price;
    
    // Debug logging
    console.log('🔍 DEBUG: Room creation data:', {
      original: { room_type, room_number, price, name, type, price_per_night },
      mapped: { finalRoomType, finalRoomNumber, finalPrice },
      capacity,
      description
    });

    let roomImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const processedImage = await processImage(file, {
          width: 800,
          height: 600,
          quality: 85,
          format: 'jpeg'
        }, 'rooms');
        roomImages.push(`/uploads/rooms/${processedImage.filename}`);
      }
    }

    const room = new Room({
      hotel_id: hotel._id,
      name: finalRoomNumber, // Map to 'name' field in Room model
      type: finalRoomType,   // Map to 'type' field in Room model
      price_per_night: finalPrice, // Map to 'price_per_night' field in Room model
      capacity,
      amenities: amenities || [],
      images: roomImages,
      description,
      status: 'available'
    });

    await room.save();

    res.status(201).json({ success: true, data: room, message: 'Room created successfully' });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(400).json({ success: false, message: 'Error creating room', error: error.message });
  }
};

// Get rooms with booking status
exports.getRoomsWithBookingStatus = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.hotelId);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    const rooms = await Room.find({ hotel_id: hotel._id })
      .populate({
        path: 'bookings',
        match: { 
          check_out_date: { $gte: new Date() },
          status: { $in: ['confirmed', 'checked_in'] }
        }
      });

    const roomsWithStatus = rooms.map(room => {
      const roomObj = room.toObject();
      const activeBooking = room.bookings && room.bookings.length > 0 ? room.bookings[0] : null;
      
      return {
        ...roomObj,
        is_occupied: !!activeBooking,
        current_booking: activeBooking
      };
    });

    res.json({ success: true, data: roomsWithStatus });
  } catch (error) {
    console.error('Error fetching rooms with booking status:', error);
    res.status(500).json({ success: false, message: 'Error fetching rooms', error: error.message });
  }
};