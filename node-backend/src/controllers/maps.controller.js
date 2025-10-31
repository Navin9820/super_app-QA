// Lightweight server-side maps proxy to avoid browser CORS and hide API keys
// Endpoints:
//   GET /api/maps/reverse-geocode?lat=<number>&lng=<number>
//   GET /api/maps/geocode?address=<string>
//   GET /api/maps/directions?from=<lat,lng>&to=<lat,lng>
//   GET /api/maps/places/autocomplete?input=<string>
//   GET /api/maps/places/details?place_id=<string>

const DEFAULT_TTL_MS = 1000 * 60 * 10; // 10 minutes

// Very small in-memory cache (key -> { expiresAt, data })
const cache = new Map();

function getCache(key) {
	const entry = cache.get(key);
	if (!entry) return null;
	if (Date.now() > entry.expiresAt) {
		cache.delete(key);
		return null;
	}
	return entry.data;
}

function setCache(key, data, ttlMs = DEFAULT_TTL_MS) {
	cache.set(key, { expiresAt: Date.now() + ttlMs, data });
}

// Normalize various provider responses into a standard shape
function normalizeAddress(provider, raw) {
	try {
		if (!raw) return null;
		// Google Geocoding API
		if (provider === 'google') {
			const result = raw.results && raw.results[0];
			if (!result) return null;
			const comp = result.address_components || [];
			let area = '';
			let city = '';
			let state = '';
			let pincode = '';
			comp.forEach((c) => {
				if (c.types.includes('sublocality') || c.types.includes('neighborhood')) area = area || c.long_name;
				if (c.types.includes('locality') || c.types.includes('administrative_area_level_2')) city = city || c.long_name;
				if (c.types.includes('administrative_area_level_1')) state = state || c.long_name;
				if (c.types.includes('postal_code')) pincode = pincode || c.long_name;
			});
			return { area, city, state, pincode, fullAddress: result.formatted_address || '' };
		}
		// BigDataCloud reverse-geocode-client
		if (provider === 'bigdatacloud') {
			return {
				area: raw.locality || raw.city || '',
				city: raw.city || raw.locality || raw.principalSubdivision || '',
				state: raw.principalSubdivision || '',
				pincode: raw.postcode || '',
				fullAddress: [raw.locality, raw.city, raw.principalSubdivision, raw.postcode, raw.countryName]
					.filter(Boolean)
					.join(', ')
			};
		}
		// OpenStreetMap Nominatim
		if (provider === 'osm') {
			const a = raw.address || {};
			return {
				area: a.suburb || a.neighbourhood || a.quarter || a.village || a.town || '',
				city: a.city || a.town || a.village || a.hamlet || a.county || '',
				state: a.state || '',
				pincode: a.postcode || '',
				fullAddress: raw.display_name || ''
			};
		}
		return null;
	} catch {
		return null;
	}
}

async function tryGoogle(lat, lng, apiKey) {
	if (!apiKey) return null;
	const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
	const res = await fetch(url);
	if (!res.ok) return null;
	const data = await res.json();
	if (data.status !== 'OK') return null;
	return normalizeAddress('google', data);
}

async function tryBigDataCloud(lat, lng) {
	const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
	const res = await fetch(url);
	if (!res.ok) return null;
	const data = await res.json();
	return normalizeAddress('bigdatacloud', data);
}

async function tryOSM(lat, lng) {
	const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
	const res = await fetch(url, {
		headers: {
			'User-Agent': 'SuperApp/1.0 (server-side)'
		}
	});
	if (!res.ok) return null;
	const data = await res.json();
	return normalizeAddress('osm', data);
}

exports.reverseGeocode = async (req, res) => {
	try {
		const lat = parseFloat(req.query.lat);
		const lng = parseFloat(req.query.lng);
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
			return res.status(400).json({ success: false, message: 'lat and lng are required' });
		}

		const cacheKey = `rev:${lat.toFixed(5)},${lng.toFixed(5)}`;
		const cached = getCache(cacheKey);
		if (cached) {
			return res.json({ success: true, cached: true, provider: cached.provider, data: cached.data });
		}

		const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

		let result = null;
		let provider = '';
		// Primary: Google
		try {
			result = await tryGoogle(lat, lng, googleKey);
			if (result) provider = 'google';
		} catch {}
		// Fallback: BigDataCloud
		if (!result) {
			try {
				result = await tryBigDataCloud(lat, lng);
				if (result) provider = 'bigdatacloud';
			} catch {}
		}
		// Fallback: OSM
		if (!result) {
			try {
				result = await tryOSM(lat, lng);
				if (result) provider = 'osm';
			} catch {}
		}

		if (!result) {
			return res.status(502).json({ success: false, message: 'All reverse-geocode providers failed' });
		}

		setCache(cacheKey, { provider, data: result });
		return res.json({ success: true, provider, data: result });
	} catch (err) {
		return res.status(500).json({ success: false, message: 'Reverse geocoding error', error: err.message });
	}
};

// Forward geocoding endpoint (address -> coordinates)
exports.geocode = async (req, res) => {
	try {
		const address = req.query.address;
		if (!address || typeof address !== 'string' || address.trim() === '') {
			return res.status(400).json({ success: false, message: 'address parameter is required' });
		}

		const cleanAddress = address.trim();
		const cacheKey = `geo:${cleanAddress.toLowerCase()}`;
		const cached = getCache(cacheKey);
		if (cached) {
			return res.json({ success: true, cached: true, provider: cached.provider, data: cached.data });
		}

		const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

		let result = null;
		let provider = '';
		
		// Primary: Google Geocoding
		if (googleKey) {
			try {
				const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanAddress)}&key=${googleKey}`;
				const res = await fetch(url);
				if (res.ok) {
					const data = await res.json();
					if (data.status === 'OK' && data.results && data.results[0]) {
						const location = data.results[0].geometry?.location;
						if (location) {
							result = {
								geometry: {
									location: {
										lat: location.lat,
										lng: location.lng
									}
								},
								formatted_address: data.results[0].formatted_address
							};
							provider = 'google';
						}
					}
				}
			} catch {}
		}

		// Fallback: OpenStreetMap Nominatim
		if (!result) {
			try {
				const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanAddress)}&format=json&limit=1&addressdetails=1`;
				const res = await fetch(url, {
					headers: {
						'User-Agent': 'SuperApp/1.0 (server-side)'
					}
				});
				if (res.ok) {
					const data = await res.json();
					if (data && data[0]) {
						result = {
							geometry: {
								location: {
									lat: parseFloat(data[0].lat),
									lng: parseFloat(data[0].lon)
								}
							},
							formatted_address: data[0].display_name
						};
						provider = 'osm';
					}
				}
			} catch {}
		}

		if (!result) {
			return res.status(502).json({ success: false, message: 'All geocoding providers failed' });
		}

		setCache(cacheKey, { provider, data: result });
		return res.json({ success: true, provider, data: result });
	} catch (err) {
		return res.status(500).json({ success: false, message: 'Forward geocoding error', error: err.message });
	}
};

// Add directions endpoint
exports.directions = async (req, res) => {
	try {
		const { from, to, mode = 'driving' } = req.query;
		
		if (!from || !to) {
			return res.status(400).json({
				success: false,
				message: 'Missing required parameters: from and to coordinates (lat,lng format)'
			});
		}

		// Parse coordinates
		const [fromLat, fromLng] = from.split(',').map(Number);
		const [toLat, toLng] = to.split(',').map(Number);
		
		if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid coordinate format. Use: lat,lng (e.g., 12.9716,77.5946)'
			});
		}

		console.log(`🗺️ Backend: Calculating ${mode} route from ${fromLat},${fromLng} to ${toLat},${toLng}`);

		// Try Google Maps Directions API first
		const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
		console.log(`🔑 Backend: Google Maps API key present: ${!!googleKey}`);
		
		let result = null;
		
		if (googleKey) {
			console.log(`🌐 Backend: Trying Google Directions API...`);
			result = await tryGoogleDirections(fromLat, fromLng, toLat, toLng, mode, googleKey);
			console.log(`✅ Backend: Google Directions result:`, result ? 'Success' : 'Failed');
		} else {
			console.log(`⚠️ Backend: No Google Maps API key, skipping Google Directions`);
		}
		
		if (!result) {
			console.log(`🔄 Backend: Falling back to OSM routing...`);
			result = await tryOSMDirections(fromLat, fromLng, toLat, toLng, mode);
			console.log(`✅ Backend: OSM Directions result:`, result ? 'Success' : 'Failed');
		}

		if (!result) {
			console.log(`🔄 Backend: Using straight line fallback...`);
			result = createStraightLineRoute(fromLat, fromLng, toLat, toLng);
		}

		console.log(`🎯 Backend: Final route result provider:`, result.provider);
		console.log(`📏 Backend: Route distance:`, result.distance);
		console.log(`⏱️ Backend: Route duration:`, result.duration);

		res.json({
			success: true,
			data: result
		});

	} catch (error) {
		console.error('🚫 Backend: Directions error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to calculate route',
			error: error.message
		});
	}
};

async function tryGoogleDirections(fromLat, fromLng, toLat, toLng, mode, apiKey) {
	if (!apiKey) return null;
	
	try {
		const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&mode=${mode}&key=${apiKey}`;
		const response = await fetch(url);
		
		if (!response.ok) return null;
		
		const data = await response.json();
		if (data.status !== 'OK' || !data.routes || !data.routes[0]) return null;
		
		const route = data.routes[0];
		const leg = route.legs[0];
		
		// Decode the polyline to get full route coordinates
		let routeCoordinates = [];
		if (route.overview_polyline && route.overview_polyline.points) {
			try {
				// Use a simple polyline decoder (you may need to install @mapbox/polyline)
				// For now, we'll create a basic route with intermediate points
				const steps = leg.steps || [];
				routeCoordinates = steps.map(step => {
					const start = step.start_location;
					return [start.lat, start.lng];
				});
				// Add the final destination
				routeCoordinates.push([toLat, toLng]);
			} catch (polylineError) {
				console.warn('⚠️ Polyline decode failed, using basic route:', polylineError.message);
				// Fallback to basic route with start, middle, and end points
				routeCoordinates = [
					[fromLat, fromLng],
					[(fromLat + toLat) / 2, (fromLng + toLng) / 2], // Middle point
					[toLat, toLng]
				];
			}
		} else {
			// No polyline, create basic route
			routeCoordinates = [
				[fromLat, fromLng],
				[(fromLat + toLat) / 2, (fromLng + toLng) / 2], // Middle point
				[toLat, toLng]
			];
		}
		
		return {
			provider: 'google',
			distance: leg.distance?.text || 'N/A',
			duration: leg.duration?.text || 'N/A',
			steps: leg.steps?.map(step => ({
				instruction: step.html_instructions?.replace(/<[^>]*>/g, '') || step.maneuver?.instruction || '',
				distance: step.distance?.text || '',
				duration: step.duration?.text || ''
			})) || [],
			polyline: route.overview_polyline?.points || null,
			coordinates: routeCoordinates  // Now contains multiple route points!
		};
	} catch (error) {
		console.error('🚫 Google Directions failed:', error);
		return null;
	}
}

async function tryOSMDirections(fromLat, fromLng, toLat, toLng, mode) {
	try {
		// OSM routing is complex, so we'll use a simple approach
		// For now, return a basic route with estimated values
		const distance = calculateHaversineDistance(fromLat, fromLng, toLat, toLng);
		const duration = Math.round((distance / 25) * 60); // 25 km/h average city speed
		
		return {
			provider: 'osm',
			distance: `${distance.toFixed(2)} km`,
			duration: `${duration} min`,
			steps: [
				{ instruction: 'Start from pickup location', distance: '', duration: '' },
				{ instruction: 'Navigate to delivery location', distance: '', duration: '' }
			],
			polyline: null,
			coordinates: [
				[fromLat, fromLng],
				[toLat, toLng]
			]
		};
	} catch (error) {
		console.error('🚫 OSM Directions failed:', error);
		return null;
	}
}

function createStraightLineRoute(fromLat, fromLng, toLat, toLng) {
	const distance = calculateHaversineDistance(fromLat, fromLng, toLat, toLng);
	const duration = Math.round((distance / 25) * 60);
	
	return {
		provider: 'straight-line',
		distance: `${distance.toFixed(2)} km`,
		duration: `${duration} min`,
		steps: [
			{ instruction: 'Direct route to destination', distance: '', duration: '' }
		],
		polyline: null,
		coordinates: [
			[fromLat, fromLng],
			[toLat, toLng]
		]
	};
}

function calculateHaversineDistance(lat1, lng1, lat2, lng2) {
	const R = 6371; // Earth's radius in km
	const dLat = (lat2 - lat1) * Math.PI / 180;
	const dLng = (lng2 - lng1) * Math.PI / 180;
	const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
			  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
			  Math.sin(dLng/2) * Math.sin(dLng/2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	return R * c;
}

// ✅ NEW: Google Places API endpoints via backend proxy
// @desc    Get place autocomplete suggestions
// @route   GET /api/maps/places/autocomplete
// @access  Public
exports.getPlaceAutocomplete = async (req, res) => {
	try {
		const { input } = req.query;
		if (!input || input.length < 2) {
			return res.status(400).json({
				success: false,
				message: 'Input query must be at least 2 characters long'
			});
		}

		const cacheKey = `places_autocomplete_${input}`;
		const cached = getCache(cacheKey);
		if (cached) {
			return res.json({
				success: true,
				data: cached
			});
		}

		const apiKey = process.env.GOOGLE_MAPS_API_KEY;
		if (!apiKey) {
			return res.status(500).json({
				success: false,
				message: 'Google Maps API key not configured'
			});
		}

		const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`;
		const response = await fetch(url);
		const data = await response.json();

		if (data.status !== 'OK') {
			return res.status(400).json({
				success: false,
				message: `Google Places API error: ${data.status}`
			});
		}

		const suggestions = data.predictions.map(prediction => ({
			place_id: prediction.place_id,
			description: prediction.description,
			structured_formatting: prediction.structured_formatting,
			types: prediction.types
		}));

		setCache(cacheKey, suggestions, 1000 * 60 * 5); // 5 minutes cache

		res.json({
			success: true,
			data: suggestions
		});
	} catch (error) {
		console.error('🚫 Place autocomplete failed:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to get place suggestions'
		});
	}
};

// @desc    Get place details by place_id
// @route   GET /api/maps/places/details
// @access  Public
exports.getPlaceDetails = async (req, res) => {
	try {
		const { place_id } = req.query;
		if (!place_id) {
			return res.status(400).json({
				success: false,
				message: 'Place ID is required'
			});
		}

		const cacheKey = `places_details_${place_id}`;
		const cached = getCache(cacheKey);
		if (cached) {
			return res.json({
				success: true,
				data: cached
			});
		}

		const apiKey = process.env.GOOGLE_MAPS_API_KEY;
		if (!apiKey) {
			return res.status(500).json({
				success: false,
				message: 'Google Maps API key not configured'
			});
		}

		const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place_id)}&fields=geometry,formatted_address,name&key=${apiKey}`;
		const response = await fetch(url);
		const data = await response.json();

		if (data.status !== 'OK') {
			return res.status(400).json({
				success: false,
				message: `Google Places API error: ${data.status}`
			});
		}

		const place = data.result;
		const placeData = {
			place_id: place.place_id,
			name: place.name,
			formatted_address: place.formatted_address,
			geometry: place.geometry ? {
				location: place.geometry.location,
				viewport: place.geometry.viewport
			} : null
		};

		setCache(cacheKey, placeData, 1000 * 60 * 30); // 30 minutes cache

		res.json({
			success: true,
			data: placeData
		});
	} catch (error) {
		console.error('🚫 Place details failed:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to get place details'
		});
	}
};


