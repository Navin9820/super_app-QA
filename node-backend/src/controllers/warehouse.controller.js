const Warehouse = require('../models/warehouse');

// Minimal server-side geocoding using Google Geocoding API
async function geocodeAddress(fullAddress) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return null; // Geocoding unavailable; caller will handle
  }
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 'OK' && data.results && data.results[0]) {
      const loc = data.results[0].geometry?.location;
      if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
        return { latitude: loc.lat, longitude: loc.lng };
      }
    }
  } catch (e) {
    // swallow errors; validation below will cover it
  }
  return null;
}

exports.list = async (req, res) => {
  try {
    const { status } = req.query; // active|inactive|all
    const filter = {};
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    const items = await Warehouse.find(filter).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching warehouses', error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const item = await Warehouse.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching warehouse', error: err.message });
  }
};

// 🛡️ SECURE: Public endpoint for order tracking (filtered data only)
exports.getPublicById = async (req, res) => {
  try {
    const item = await Warehouse.findById(req.params.id);
    if (!item || !item.isActive) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }
    
    // 🛡️ SECURITY: Only return essential address info (no sensitive data)
    const publicData = {
      _id: item._id,
      name: item.name,
      full_address: item.full_address,
      city: item.city,
      state: item.state,
      country: item.country
    };
    
    res.json({ success: true, data: publicData });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching warehouse', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, full_address, city, state, pincode, country, phone, notes } = req.body;
    if (!name || !full_address || !city || !pincode) {
      return res.status(400).json({ success: false, message: 'Name, full address, city and pincode are required' });
    }
    const coords = await geocodeAddress(full_address + ', ' + (city || '') + ', ' + (state || '') + ', ' + (country || 'India'));
    if (!coords) {
      return res.status(400).json({ success: false, message: 'Could not validate address. Please refine and try again.' });
    }
    const item = await Warehouse.create({
      name,
      full_address,
      city,
      state,
      pincode,
      country: country || 'India',
      phone,
      notes,
      latitude: coords.latitude,
      longitude: coords.longitude,
      isActive: true
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating warehouse', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const item = await Warehouse.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Warehouse not found' });

    const { name, full_address, city, state, pincode, country, phone, notes, isActive } = req.body;
    if (name !== undefined) item.name = name;
    if (full_address !== undefined) item.full_address = full_address;
    if (city !== undefined) item.city = city;
    if (state !== undefined) item.state = state;
    if (pincode !== undefined) item.pincode = pincode;
    if (country !== undefined) item.country = country;
    if (phone !== undefined) item.phone = phone;
    if (notes !== undefined) item.notes = notes;
    if (typeof isActive === 'boolean') item.isActive = isActive;

    // If address fields changed, re-geocode implicitly
    if (full_address || city || state || country) {
      const full = (item.full_address || '') + ', ' + (item.city || '') + ', ' + (item.state || '') + ', ' + (item.country || 'India');
      const coords = await geocodeAddress(full);
      if (!coords) {
        return res.status(400).json({ success: false, message: 'Could not validate address. Please refine and try again.' });
      }
      item.latitude = coords.latitude;
      item.longitude = coords.longitude;
    }

    await item.save();
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating warehouse', error: err.message });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const item = await Warehouse.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    item.isActive = !item.isActive;
    await item.save();
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error toggling status', error: err.message });
  }
};

exports.setDefault = async (req, res) => {
  try {
    const item = await Warehouse.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    if (!item.isActive) return res.status(400).json({ success: false, message: 'Only active warehouse can be set as default' });
    // Unset current default
    await Warehouse.updateMany({ isDefault: true }, { $set: { isDefault: false } });
    item.isDefault = true;
    await item.save();
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error setting default warehouse', error: err.message });
  }
};


