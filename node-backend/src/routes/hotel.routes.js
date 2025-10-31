const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const hotelController = require('../controllers/hotel.controller');
const upload = require('../middlewares/upload.middleware');
const { validateImage } = require('../middlewares/imageValidation.middleware');

// Public routes
router.get('/', hotelController.getAllHotels);
router.get('/:id', hotelController.getHotelById);

// Protected routes - require authentication
router.use(protect);

// Room management routes (admin and hotel_admin)
router.get('/:hotelId/rooms-with-booking-status', authorize('admin', 'hotel_admin'), hotelController.getRoomsWithBookingStatus);
router.post('/:hotelId/rooms', authorize('admin', 'hotel_admin'), upload.array('images'), hotelController.createRoomForHotel);

// Admin-only routes
router.use(authorize('admin'));
router.post('/', upload.single('main_image'), validateImage, hotelController.createHotel);
router.put('/:id', upload.single('main_image'), hotelController.updateHotel);
router.delete('/:id', hotelController.deleteHotel);

module.exports = router;