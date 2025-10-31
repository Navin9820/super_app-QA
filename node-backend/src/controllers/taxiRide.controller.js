const { TaxiRide, TaxiDriver, TaxiVehicle, User, Rider } = require('../models');

module.exports = {
  // List all rides (optionally filter by user_id, driver_id, vehicle_id)
  async getAll(req, res) {
    try {
      const filter = {};
      if (req.query.user_id) filter.user_id = req.query.user_id;
      if (req.query.driver_id) filter.driver_id = req.query.driver_id;
      if (req.query.vehicle_id) filter.vehicle_id = req.query.vehicle_id;

      const rides = await TaxiRide.find(filter)
        .populate('user_id')
        .populate('driver_id')
        .populate('vehicle_id')
        .sort({ createdAt: -1 });
      res.json({ success: true, data: rides });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error fetching taxi rides', error: err.message });
    }
  },

  // Get user's own rides
  async getUserRides(req, res) {
    try {
      const userId = req.user.id;
      const rides = await TaxiRide.find({ user_id: userId })
        .populate('user_id')
        .populate('driver_id')
        .populate('vehicle_id')
        .populate({
          path: 'driver_info.driver_id',
          select: 'name phone vehicle_type vehicle_number'
        }) // ✅ NEW: Populate driver information
        .sort({ createdAt: -1 });
      res.json({ success: true, data: rides });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error fetching user rides', error: err.message });
    }
  },

  // Get user's own ride by ID (security: user can only access their own rides)
  async getUserRideById(req, res) {
    try {
      const userId = req.user.id;
      const rideId = req.params.id;
      
      const ride = await TaxiRide.findById(rideId)
        .populate('user_id')
        .populate('driver_id')
        .populate('vehicle_id');
      
      if (!ride) {
        return res.status(404).json({ success: false, message: 'Taxi ride not found' });
      }
      
      // Security check: user can only access their own rides
      if (ride.user_id._id.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only view your own rides' });
      }
      
      res.json({ success: true, data: ride });
    } catch (err) {
      console.error('Error in getUserRideById:', err);
      res.status(500).json({ success: false, message: 'Error fetching taxi ride', error: err.message });
    }
  },

  // Get ride by ID
  async getById(req, res) {
    try {
      const ride = await TaxiRide.findById(req.params.id)
        .populate('user_id')
        .populate('driver_id')
        .populate('vehicle_id')
        .populate({
          path: 'driver_info.driver_id',
          select: 'name phone vehicle_type vehicle_number'
        }); // ✅ NEW: Populate driver information
      if (!ride) return res.status(404).json({ success: false, message: 'Taxi ride not found' });
      
      
      res.json({ success: true, data: ride });
    } catch (err) {
      console.error('Error in getById:', err);
      res.status(500).json({ success: false, message: 'Error fetching taxi ride', error: err.message });
    }
  },

  // Create ride
  async create(req, res) {
    try {
      const { user_id, driver_id, vehicle_id, pickup_location, dropoff_location, fare, status, started_at, completed_at, vehicle_type } = req.body;
      
      // Get user_id from request body or from authenticated user
      const finalUserId = user_id || req.user.id;
      
      
      // Validate required fields
      if (!finalUserId) {
        console.error('❌ Missing required field: user_id');
        return res.status(400).json({ 
          success: false, 
          message: 'User ID is required', 
          error: 'Missing required field: user_id' 
        });
      }
      
      // Update driver workload when ride is created
      if (driver_id) {
        await TaxiDriver.findByIdAndUpdate(driver_id, {
          $inc: { current_rides: 1, total_rides: 1 },
          last_assignment: new Date()
        });
        console.log('🚕 Updated driver workload for driver:', driver_id);
      }
      
      const ride = await TaxiRide.create({ 
        user_id: finalUserId, 
        driver_id, 
        vehicle_id, 
        pickup_location, 
        dropoff_location, 
        fare, 
        status, 
        vehicle_type: vehicle_type || 'Auto', // ✅ Add customer's requested vehicle type
        started_at: started_at ? new Date(started_at) : null,
        completed_at: completed_at ? new Date(completed_at) : null
      });

      // ✅ Generate 6-digit OTP for taxi ride
      const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      console.log('🔍 taxiRide.controller.js - Generating OTP:', deliveryOtp);
      
      ride.delivery_otp = {
        code: deliveryOtp,
        expiresAt,
        attempts_left: 5,
        resend_count: 0
      };
      await ride.save();
      console.log('✅ Taxi ride OTP generated and saved:', deliveryOtp);
      
      // Create order assignment for rider app
      const OrderAssignment = require('../models/orderAssignment');
      const assignmentData = {
        order_id: ride._id,
        order_type: 'taxi',
        pickup_address: pickup_location.address,
        dropoff_address: dropoff_location.address,
        pickup_coordinates: [pickup_location.latitude, pickup_location.longitude],
        dropoff_coordinates: [dropoff_location.latitude, dropoff_location.longitude],
        fare: fare,
        status: 'assigned'
      };
      
      // Only set rider_id if driver_id is provided
      if (driver_id) {
        assignmentData.rider_id = driver_id;
      }
      
      const orderAssignment = new OrderAssignment(assignmentData);
      
      await orderAssignment.save();
      console.log('✅ OrderAssignment created for taxi ride:', orderAssignment._id);
      
      // Return populated data
      const createdRide = await TaxiRide.findById(ride._id)
        .populate('user_id')
        .populate('driver_id')
        .populate('vehicle_id');
      console.log('taxiRide.controller.js: Ride created and saved:', createdRide);
      
      // ✅ Include OTP in response for frontend display
      const responseData = {
        ...createdRide.toObject(),
        delivery_otp: createdRide.delivery_otp?.code || null
      };
      
      console.log('🔍 taxiRide.controller.js - Response data being sent:', responseData);
      console.log('🔍 taxiRide.controller.js - OTP in response:', responseData.delivery_otp);
        
      res.status(201).json({ success: true, message: 'Taxi ride created successfully', data: responseData });
    } catch (err) {
      console.error('taxiRide.controller.js: Error creating taxi ride:', err);
      res.status(400).json({ success: false, message: 'Error creating taxi ride', error: err.message });
    }
  },

  // Update ride
  async update(req, res) {
    try {
      console.log('taxiRide.controller.js: Received PUT /api/taxi-rides/:id with body:', req.body);
      const ride = await TaxiRide.findById(req.params.id);
      if (!ride) return res.status(404).json({ success: false, message: 'Taxi ride not found' });
      


      // Handle pickup_location - can be object or string
      let pickupLocation = ride.pickup_location || {};
      if (req.body.pickup_location) {
        if (typeof req.body.pickup_location === 'object') {
          pickupLocation = req.body.pickup_location;
        } else {
          pickupLocation.address = req.body.pickup_location;
        }
      } else if (req.body.pickup_address) {
        pickupLocation.address = req.body.pickup_address;
      }

      // Handle dropoff_location - can be object or string
      let dropoffLocation = ride.dropoff_location || {};
      if (req.body.dropoff_location) {
        if (typeof req.body.dropoff_location === 'object') {
          dropoffLocation = req.body.dropoff_location;
        } else {
          dropoffLocation.address = req.body.dropoff_location;
        }
      } else if (req.body.dropoff_address) {
        dropoffLocation.address = req.body.dropoff_address;
      }

      // Map frontend status to valid backend status
      let backendStatus = req.body.status || ride.status;
      if (req.body.status === 'customer_picked_up') {
        backendStatus = 'picked_up';  // ✅ Map 'customer_picked_up' to 'picked_up'
      } else if (req.body.status === 'trip_completed') {
        backendStatus = 'completed';  // ✅ Map 'trip_completed' to 'completed'
      } else if (req.body.status === 'destination_arrived') {
        backendStatus = 'delivered';  // ✅ Map 'destination_arrived' to 'delivered'
      }
      
      // Log status mapping for debugging
      if (req.body.status && req.body.status !== backendStatus) {
        console.log(`🔄 TaxiRide status mapping: '${req.body.status}' → '${backendStatus}'`);
      }

      // Update fields with proper validation - only allow certain fields to be updated
      const updateData = {
        // Allow status updates (most common use case)
        status: backendStatus,
        
        // Allow timing updates
        started_at: req.body.started_at ? new Date(req.body.started_at) : ride.started_at,
        completed_at: req.body.completed_at ? new Date(req.body.completed_at) : ride.completed_at,
        
        // Allow fare adjustments (for corrections)
        fare: req.body.fare !== undefined ? req.body.fare : ride.fare,
        
        // Allow location corrections (for admin fixes)
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        
        // Only allow user/driver/vehicle changes if explicitly provided (for admin corrections)
        ...(req.body.user_id && { user_id: req.body.user_id }),
        ...(req.body.driver_id && { driver_id: req.body.driver_id }),
        ...(req.body.vehicle_id && { vehicle_id: req.body.vehicle_id }),
      };

      // Only update fields that are provided
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          ride[key] = updateData[key];
        }
      });

      // Set timestamps based on status changes
      if (req.body.status && backendStatus !== ride.status) {
        switch (backendStatus) {
          case 'picked_up':
            ride.picked_up_at = new Date();
            break;
          case 'delivered':
            ride.delivered_at = new Date();
            break;
          case 'completed':
            ride.completed_at = new Date();
            // Decrease current rides when ride is completed
            await TaxiDriver.findByIdAndUpdate(ride.driver_id, [
              {
                $set: {
                  current_rides: {
                    $max: [{ $subtract: ['$current_rides', 1] }, 0]
                  }
                }
              }
            ]);
            console.log('🚕 Decreased driver workload for completed ride');
            break;
          case 'cancelled':
            // Decrease current rides when ride is cancelled
            await TaxiDriver.findByIdAndUpdate(ride.driver_id, [
              {
                $set: {
                  current_rides: {
                    $max: [{ $subtract: ['$current_rides', 1] }, 0]
                  }
                }
              }
            ]);
            console.log('🚕 Decreased driver workload for cancelled ride');
            break;
        }
      }
      
      await ride.save();
      const updatedRide = await TaxiRide.findById(ride._id)
        .populate('user_id')
        .populate('driver_id')
        .populate('vehicle_id');
      console.log('taxiRide.controller.js: Ride updated and saved:', updatedRide);

      res.json({ success: true, message: 'Taxi ride updated successfully', data: updatedRide });
    } catch (err) {
      console.error('taxiRide.controller.js: Error updating taxi ride:', err);
      res.status(400).json({ success: false, message: 'Error updating taxi ride', error: err.message });
    }
  },

  // Soft delete ride (mark as cancelled instead of hard delete)
  async delete(req, res) {
    try {
      const ride = await TaxiRide.findById(req.params.id);
      if (!ride) return res.status(404).json({ success: false, message: 'Taxi ride not found' });
      
      // Instead of deleting, mark as cancelled to preserve records
      ride.status = 'cancelled';
      await ride.save();
      
      res.json({ success: true, message: 'Taxi ride cancelled successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error cancelling taxi ride', error: err.message });
    }
  },

  // Accept taxi ride (assign driver)
  async acceptRide(req, res) {
    try {
      console.log('🚗 Accept ride request received for ride ID:', req.params.id);
      console.log('🚗 Driver info from request:', req.rider);
      
      const rideId = req.params.id;
      const driverId = req.rider.id;
      const driverType = req.rider.type;
      
      // Find the ride
      const ride = await TaxiRide.findById(rideId);
      if (!ride) {
        return res.status(404).json({ 
          success: false, 
          message: 'Taxi ride not found' 
        });
      }
      
      // Check if ride is already accepted
      if (ride.status !== 'pending') {
        return res.status(400).json({ 
          success: false, 
          message: `Ride cannot be accepted. Current status: ${ride.status}` 
        });
      }
      
      // Check if ride is already assigned to another driver
      if (ride.driver_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Ride is already assigned to another driver' 
        });
      }
      
      // Get driver information for saving - check all driver models
      let driver = await Rider.findById(driverId);
      let driverModuleType = null;
      
      if (driver) {
        driverModuleType = driver.module_type;
        console.log('🔍 Found driver in Rider model');
      } else {
        // Check TaxiDriver model
        const TaxiDriver = require('../models/taxidriver');
        const taxiDriver = await TaxiDriver.findById(driverId);
        if (taxiDriver) {
          driver = taxiDriver;
          driverModuleType = taxiDriver.module_type;
          console.log('🔍 Found driver in TaxiDriver model');
        } else {
          // Check PorterDriver model
          const PorterDriver = require('../models/porterdriver');
          const porterDriver = await PorterDriver.findById(driverId);
          if (porterDriver) {
            driver = porterDriver;
            driverModuleType = porterDriver.module_type;
            console.log('🔍 Found driver in PorterDriver model');
          }
        }
      }
      
      if (!driver) {
        console.log('❌ Driver not found in any model:', driverId);
        return res.status(404).json({
          success: false,
          message: 'Driver not found'
        });
      }

      // Prepare driver info object
      const driverInfo = {
        driver_id: driverId,
        driver_name: driver.name,
        driver_phone: driver.phone,
        vehicle_type: driver.vehicle_type,
        vehicle_number: driver.vehicle_number,
        assigned_at: new Date()
      };

      console.log('🔍 TaxiRide Controller: Saving driver info:', driverInfo);

      // Update the ride with driver assignment
      const updatedRide = await TaxiRide.findByIdAndUpdate(
        rideId,
        {
          driver_id: driverId,
          status: 'accepted',
          assigned_at: new Date(),
          driver_info: driverInfo, // ✅ NEW: Save complete driver information
          updatedAt: new Date()
        },
        { new: true }
      ).populate('user_id driver_id vehicle_id');
      
      
      res.json({
        success: true,
        message: 'Taxi ride accepted successfully',
        data: updatedRide
      });
      
    } catch (err) {
      console.error('❌ Error accepting taxi ride:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Error accepting taxi ride', 
        error: err.message 
      });
    }
  },

  // Cancel taxi ride
  async cancelRide(req, res) {
    try {
      const ride = await TaxiRide.findByIdAndUpdate(
        req.params.id,
        { 
          status: 'cancelled',
          payment_status: 'failed',
          cancelled_at: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );
      
      if (!ride) {
        return res.status(404).json({ success: false, message: 'Taxi ride not found' });
      }
      
      res.json({ 
        success: true, 
        message: 'Taxi ride cancelled successfully',
        data: ride 
      });
    } catch (err) {
      console.error('❌ Error cancelling taxi ride:', err);
      res.status(500).json({ success: false, message: 'Error cancelling taxi ride', error: err.message });
    }
  }
}; 