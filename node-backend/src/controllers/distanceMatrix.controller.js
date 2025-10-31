const axios = require('axios');

// Google Distance Matrix API proxy controller
const calculateRoute = async (req, res) => {
    try {
        const { origins, destinations } = req.body;
        
        if (!origins || !destinations || !Array.isArray(origins) || !Array.isArray(destinations)) {
            return res.status(400).json({
                success: false,
                message: 'Origins and destinations arrays are required'
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

        // Format origins and destinations for Google API
        const originsStr = origins.map(coord => `${coord.lat},${coord.lng}`).join('|');
        const destinationsStr = destinations.map(coord => `${coord.lat},${coord.lng}`).join('|');

        // Call Google Distance Matrix API
        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
            params: {
                origins: originsStr,
                destinations: destinationsStr,
                mode: 'driving',
                units: 'metric',
                key: apiKey
            }
        });

        const data = response.data;
        
        if (data.status === 'OK' && data.rows.length > 0 && data.rows[0].elements.length > 0) {
            const element = data.rows[0].elements[0];
            
            if (element.status === 'OK') {
                // Convert distance from meters to kilometers
                const distance = element.distance.value / 1000;
                // Convert duration from seconds to minutes
                const duration = Math.ceil(element.duration.value / 60);
                
                return res.json({
                    success: true,
                    data: {
                        distance: distance,
                        duration: duration,
                        distance_text: element.distance.text,
                        duration_text: element.duration.text
                    }
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: `Route calculation failed: ${element.status}`,
                    error: element.error_message || 'Unknown error'
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: `Distance Matrix API failed: ${data.status}`,
                error: data.error_message || 'Unknown error'
            });
        }
        
    } catch (error) {
        console.error('Distance Matrix error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during route calculation',
            error: error.message
        });
    }
};

module.exports = {
    calculateRoute
};
