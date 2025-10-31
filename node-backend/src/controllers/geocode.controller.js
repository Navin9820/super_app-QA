const axios = require('axios');

// Google Geocoding API proxy controller
const geocodeAddress = async (req, res) => {
    try {
        const { address } = req.query;
        
        if (!address) {
            return res.status(400).json({
                success: false,
                message: 'Address parameter is required'
            });
        }

        // Get Google Maps API key from environment
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                success: false,
                message: 'Google Maps API key not configured'
            });
        }

        // Call Google Geocoding API
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: address,
                key: apiKey
            }
        });

        const data = response.data;
        
        if (data.status === 'OK' && data.results.length > 0) {
            const result = data.results[0];
            const location = result.geometry.location;
            
            return res.json({
                success: true,
                data: {
                    lat: location.lat,
                    lng: location.lng,
                    formatted_address: result.formatted_address,
                    place_id: result.place_id
                }
            });
        } else if (data.status === 'ZERO_RESULTS') {
            return res.status(404).json({
                success: false,
                message: 'No results found for this address'
            });
        } else {
            return res.status(400).json({
                success: false,
                message: `Geocoding failed: ${data.status}`,
                error: data.error_message || 'Unknown error'
            });
        }
        
    } catch (error) {
        console.error('Geocoding error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during geocoding',
            error: error.message
        });
    }
};

module.exports = {
    geocodeAddress
};
