
// Centralized Profile Service
// - Stores a unified profile at key 'globalUserProfile'
// - Reads legacy/module-specific profiles and normalizes into unified shape
// - Syncs writes back to module-specific keys for backward compatibility

const UNIFIED_KEY = 'globalUserProfile';

// Helper: safe JSON parse
function parseJson(item) {
	try {
		return JSON.parse(item);
	} catch {
		return null;
	}
}

// Helper: compress large strings (like base64 images)
function compressString(str, maxLength = 100000) { // 100KB limit
	if (!str || str.length <= maxLength) return str;
	
	// If it's a base64 image, try to compress it properly
	if (str.startsWith('data:image/')) {
		// For images, we should compress them using canvas instead of truncating
		// This is a fallback for when compression wasn't done at upload time
		console.warn('Image data is too large, consider compressing at upload time');
		return str.substring(0, maxLength) + '...[truncated]';
	}
	
	// For other strings, truncate
	return str.substring(0, maxLength) + '...[truncated]';
}

// Helper: safe localStorage setItem with quota handling
function safeSetItem(key, value) {
	try {
		// Compress large values
		const compressedValue = typeof value === 'string' ? compressString(value) : value;
		localStorage.setItem(key, compressedValue);
		return true;
	} catch (error) {
		if (error.name === 'QuotaExceededError') {
			console.warn(`localStorage quota exceeded for key: ${key}. Attempting to clear old data...`);
			
			// Try to clear some old data and retry
			try {
				// Use the cleanup function
				clearOldLocalStorageData();
				
				// Retry with compressed data
				const compressedValue = typeof value === 'string' ? compressString(value, 30000) : value; // Even smaller limit
				localStorage.setItem(key, compressedValue);
				return true;
			} catch (retryError) {
				console.error(`Failed to save ${key} even after clearing old data:`, retryError);
				return false;
			}
		}
		console.error(`Error saving ${key}:`, error);
		return false;
	}
}

// Helper: split full name
function splitFullName(fullName) {
	if (!fullName || typeof fullName !== 'string') return { firstName: '', lastName: '' };
	const parts = fullName.trim().split(/\s+/);
	if (parts.length === 1) return { firstName: parts[0], lastName: '' };
	const firstName = parts.shift();
	const lastName = parts.join(' ');
	return { firstName, lastName };
}

// Helper: clear old localStorage data to free up space
function clearOldLocalStorageData() {
	try {
		const keysToRemove = [
			'userProfileImage',
			'globalUserProfile',
			'userAddresses',
			'delivery_address'
		];
		
		keysToRemove.forEach(key => {
			try {
				localStorage.removeItem(key);
			} catch (e) {
				// Ignore individual removal errors
			}
		});
		
		// Also check for large data and remove if needed
		const allKeys = Object.keys(localStorage);
		allKeys.forEach(key => {
			try {
				const data = localStorage.getItem(key);
				if (data && data.length > 50000) { // If larger than 50KB
					localStorage.removeItem(key);
					console.log(`Removed large data: ${key}`);
				}
			} catch (e) {
				// Ignore errors
			}
		});
		
		console.log('Cleared old localStorage data to free up space');
	} catch (error) {
		console.warn('Error clearing localStorage:', error);
	}
}

// Helper: compress image data URL
function compressImageDataUrl(dataUrl, maxSize = 300, quality = 0.7) {
	return new Promise((resolve, reject) => {
		if (!dataUrl || !dataUrl.startsWith('data:image/')) {
			resolve(dataUrl);
			return;
		}
		
		const img = new Image();
		img.onload = () => {
			try {
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');
				
				// Calculate new dimensions
				let { width, height } = img;
				
				if (width > height) {
					if (width > maxSize) {
						height = (height * maxSize) / width;
						width = maxSize;
					}
				} else {
					if (height > maxSize) {
						width = (width * maxSize) / height;
						height = maxSize;
					}
				}
				
				canvas.width = width;
				canvas.height = height;
				ctx.drawImage(img, 0, 0, width, height);
				
				// Convert to compressed JPEG
				const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
				resolve(compressedDataUrl);
			} catch (error) {
				console.error('Image compression failed:', error);
				resolve(dataUrl); // Return original if compression fails
			}
		};
		img.onerror = () => {
			console.error('Failed to load image for compression');
			resolve(dataUrl); // Return original if loading fails
		};
		img.src = dataUrl;
	});
}

// Helper: get current user identifier from auth data
function getCurrentUserIdentifier() {
	// Try to get from auth service first
	const userData = parseJson(localStorage.getItem('userData')) || {};
	if (userData.email && userData.phone) {
		return `${userData.email}-${userData.phone}`;
	}
	
	// Fallback to other auth keys
	const userEmail = localStorage.getItem('userEmail');
	const userPhone = localStorage.getItem('userPhone');
	if (userEmail && userPhone) {
		return `${userEmail}-${userPhone}`;
	}
	
	return null;
}

// Helper: get stored user identifier from profile data
function getStoredUserIdentifier() {
	const unifiedRaw = localStorage.getItem(UNIFIED_KEY);
	if (unifiedRaw) {
		const unified = parseJson(unifiedRaw) || {};
		if (unified.email && unified.phone) {
			return `${unified.email}-${unified.phone}`;
		}
	}
	
	// Check legacy profiles
	const { grocery, taxi, hotel, auth } = readLegacyModuleProfiles();
	const profiles = [grocery, taxi, hotel, auth];
	
	for (const profile of profiles) {
		if (profile && profile.email && profile.phone) {
			return `${profile.email}-${profile.phone}`;
		}
	}
	
	return null;
}

// Helper: clear all profile data
function clearAllProfileData() {
	try {
		// Clear all profile-related keys
		localStorage.removeItem('globalUserProfile');
		localStorage.removeItem('userProfile');
		localStorage.removeItem('taxiProfile');
		localStorage.removeItem('hotelUserProfile');
		localStorage.removeItem('hotelUserPhone');
		localStorage.removeItem('userProfileImage');
		
		// Clear notification data for new user
		localStorage.removeItem('notifications');
		localStorage.removeItem('notifications_user');
		
		// Clear address data from all modules for new user
		localStorage.removeItem('delivery_address');
		localStorage.removeItem('userAddresses');
		localStorage.removeItem('hotelUserAddresses');
		localStorage.removeItem('taxiSavedLocations');
		localStorage.removeItem('recentTaxiLocations');
		
		// Clear user data but preserve auth tokens
		const userData = parseJson(localStorage.getItem('userData')) || {};
		const authToken = localStorage.getItem('authToken');
		const tokenExpiration = localStorage.getItem('tokenExpiration');
		
		// Clear userData but keep auth info
		localStorage.removeItem('userData');
		
		// Restore auth tokens if they exist
		if (authToken) {
			localStorage.setItem('authToken', authToken);
		}
		if (tokenExpiration) {
			localStorage.setItem('tokenExpiration', tokenExpiration);
		}
		
		console.log('✅ Cleared all profile data for new user');
		console.log('📋 Cleared keys: globalUserProfile, userProfile, taxiProfile, hotelUserProfile, hotelUserPhone, userProfileImage, notifications, addresses');
		return true;
	} catch (error) {
		console.error('Failed to clear profile data:', error);
		return false;
	}
}

// Normalize any shape into unified profile
function normalizeProfile(input = {}) {
	const unified = {
		fullName: input.fullName || input.name || `${input.firstName || ''}${input.lastName ? ' ' + input.lastName : ''}`.trim(),
		phone: input.phone || input.phoneNumber || input.userPhone || '',
		email: input.email || input.emailId || input.userEmail || '',
		city: input.city || '',
		state: input.state || '',
		pincode: input.pincode || input.postcode || '',
		addressLine1: input.address_line1 || input.addressLine1 || '',
		addressLine2: input.address_line2 || input.addressLine2 || '',
		country: input.country || '',
		profileImage: input.profileImage || input.profile_picture || '',
		selected: input.selected || 'Home',
	};

	// Ensure fullName fallback from first/last if needed
	if (!unified.fullName) {
		const { firstName = '', lastName = '' } = input;
		unified.fullName = `${firstName} ${lastName}`.trim();
	}

	return unified;
}

// Merge a list of candidate profiles into a unified profile preferring first non-empty value
function mergeProfiles(candidates) {
	const fields = ['fullName','phone','email','city','state','pincode','addressLine1','addressLine2','country','profileImage','selected'];
	const result = {};
	for (const field of fields) {
		for (const candidate of candidates) {
			if (candidate && candidate[field]) {
				result[field] = candidate[field];
				break;
			}
		}
		if (!result[field]) result[field] = '';
	}
	if (!result.selected) result.selected = 'Home';
	return result;
}

function readLegacyModuleProfiles() {
	// Grocery
	const groceryRaw = parseJson(localStorage.getItem('userProfile')) || {};
	const grocery = normalizeProfile({
		fullName: groceryRaw.fullName,
		phoneNumber: groceryRaw.phoneNumber,
		emailId: groceryRaw.emailId,
		city: groceryRaw.city,
		state: groceryRaw.state,
		pincode: groceryRaw.pincode,
		profileImage: groceryRaw.profileImage,
	});

	// Taxi
	const taxiRaw = parseJson(localStorage.getItem('taxiProfile')) || {};
	const taxi = normalizeProfile(taxiRaw);

	// Hotel
	const hotelPhone = localStorage.getItem('hotelUserPhone') || '';
	const hotelRaw = parseJson(localStorage.getItem('hotelUserProfile')) || {};
	const hotel = normalizeProfile({
		firstName: hotelRaw.firstName,
		lastName: hotelRaw.lastName,
		email: hotelRaw.email,
		userPhone: hotelPhone,
	});

	// Auth userData if available
	const userData = parseJson(localStorage.getItem('userData')) || {};
	const auth = normalizeProfile({
		name: userData.name,
		email: userData.email,
		phone: userData.phone,
		address_line1: userData.address_line1,
		address_line2: userData.address_line2,
		city: userData.city,
		state: userData.state,
		pincode: userData.pincode,
		country: userData.country,
		profile_picture: userData.profile_picture,
	});

	return { grocery, taxi, hotel, auth };
}

async function syncToModules(unified) {
	if (!unified) return;
	
	// Compress profile image if it's too large
	let compressedImage = unified.profileImage || '';
	if (compressedImage && compressedImage.startsWith('data:image/')) {
		// If image is larger than 30KB, compress it aggressively
		if (compressedImage.length > 30000) {
			compressedImage = await compressImageDataUrl(compressedImage, 200, 0.5);
		}
		// If still too large, compress even more
		if (compressedImage.length > 50000) {
			compressedImage = await compressImageDataUrl(compressedImage, 150, 0.4);
		}
	}
	
	const compressedUnified = {
		...unified,
		profileImage: compressedImage
	};
	
	// Save unified profile with error handling - use minimal data
	const minimalUnified = {
		fullName: unified.fullName || '',
		phone: unified.phone || '',
		email: unified.email || '',
		addressLine1: unified.addressLine1 || '',
		addressLine2: unified.addressLine2 || '',
		city: unified.city || '',
		state: unified.state || '',
		country: unified.country || '',
		pincode: unified.pincode || '',
		// Only save profile image if it's small enough
		profileImage: compressedImage && compressedImage.length < 100000 ? compressedImage : ''
	};
	
	const unifiedSuccess = safeSetItem(UNIFIED_KEY, JSON.stringify(minimalUnified));
	if (!unifiedSuccess) {
		console.warn('Failed to save unified profile due to localStorage quota');
		// Try to save without profile image
		const noImageUnified = { ...minimalUnified, profileImage: '' };
		const retrySuccess = safeSetItem(UNIFIED_KEY, JSON.stringify(noImageUnified));
		if (!retrySuccess) {
			console.error('Failed to save profile even without image');
			return;
		}
	}

	// Grocery shape
	const grocery = {
		fullName: unified.fullName || '',
		phoneNumber: unified.phone || '',
		emailId: unified.email || '',
		city: unified.city || '',
		state: unified.state || '',
		pincode: unified.pincode || '',
		profileImage: compressedUnified.profileImage || '',
	};
	safeSetItem('userProfile', JSON.stringify(grocery));

	// Taxi shape
	const taxi = {
		fullName: unified.fullName || '',
		phone: unified.phone || '',
		email: unified.email || '',
		city: unified.city || '',
		state: unified.state || '',
		pincode: unified.pincode || '',
		selected: unified.selected || 'Home',
		profileImage: compressedUnified.profileImage || '',
	};
	safeSetItem('taxiProfile', JSON.stringify(taxi));

	// Hotel shape
	const { firstName, lastName } = splitFullName(unified.fullName || '');
	const hotel = {
		firstName,
		lastName,
		email: unified.email || '',
	};
	safeSetItem('hotelUserProfile', JSON.stringify(hotel));
	if (unified.phone) safeSetItem('hotelUserPhone', unified.phone);

	// Optional: keep userData in sync if present
	try {
		const existing = parseJson(localStorage.getItem('userData')) || {};
		const next = {
			...existing,
			name: unified.fullName || existing.name,
			email: unified.email || existing.email,
			phone: unified.phone || existing.phone,
			address_line1: unified.addressLine1 || existing.address_line1,
			address_line2: unified.addressLine2 || existing.address_line2,
			city: unified.city || existing.city,
			state: unified.state || existing.state,
			pincode: unified.pincode || existing.pincode,
			country: unified.country || existing.country,
			profile_picture: compressedUnified.profileImage || existing.profile_picture,
		};
		safeSetItem('userData', JSON.stringify(next));
	} catch (error) {
		console.warn('Failed to sync userData:', error);
	}

	// Sync address data across all modules
	syncAddressDataToAllModules(unified);
}

// Helper: sync address data to all modules
function syncAddressDataToAllModules(unified) {
	if (!unified.addressLine1 || !unified.city || !unified.state || !unified.pincode) {
		console.log('⚠️ Incomplete address data, skipping module sync');
		return;
	}

	try {
		// Create standardized address object
		const addressData = {
			type: 'Home', // Default type
			fullName: unified.fullName || '',
			phone: unified.phone || '',
			altPhone: '',
			address_line1: unified.addressLine1,
			address_line2: unified.addressLine2 || '',
			landmark: unified.addressLine2 || '',
			city: unified.city,
			state: unified.state,
			pincode: unified.pincode,
			country: unified.country || 'India',
			location: null // Will be set by individual modules if needed
		};

		// 1. Ecommerce/Clothes Module - delivery_address
		safeSetItem('delivery_address', JSON.stringify(addressData));

		// 2. Ecommerce/Clothes Module - userAddresses
		const ecommerceAddress = {
			fullName: unified.fullName || '',
			phoneNumber: unified.phone || '',
			altPhoneNumber: '',
			houseNo: unified.addressLine1,
			roadName: unified.addressLine2 || '',
			landmark: unified.addressLine2 || '',
			city: unified.city,
			state: unified.state,
			pincode: unified.pincode,
			selectedAddressType: 'Home'
		};
		const existingEcommerceAddresses = parseJson(localStorage.getItem('userAddresses')) || [];
		// Check if address already exists to avoid duplicates
		const addressExists = existingEcommerceAddresses.some(addr => 
			addr.houseNo === ecommerceAddress.houseNo && 
			addr.city === ecommerceAddress.city && 
			addr.pincode === ecommerceAddress.pincode
		);
		if (!addressExists) {
			const updatedEcommerceAddresses = [...existingEcommerceAddresses, ecommerceAddress];
			safeSetItem('userAddresses', JSON.stringify(updatedEcommerceAddresses));
		}

		// 3. Hotel Module - hotelUserAddresses
		const hotelAddress = {
			fullName: unified.fullName || '',
			phone: unified.phone || '',
			address: unified.addressLine1,
			landmark: unified.addressLine2 || '',
			city: unified.city,
			state: unified.state,
			pincode: unified.pincode,
			country: unified.country || 'India',
			addressType: 'Home'
		};
		const existingHotelAddresses = parseJson(localStorage.getItem('hotelUserAddresses')) || [];
		const hotelAddressExists = existingHotelAddresses.some(addr => 
			addr.address === hotelAddress.address && 
			addr.city === hotelAddress.city && 
			addr.pincode === hotelAddress.pincode
		);
		if (!hotelAddressExists) {
			const updatedHotelAddresses = [...existingHotelAddresses, hotelAddress];
			safeSetItem('hotelUserAddresses', JSON.stringify(updatedHotelAddresses));
		}

		// 4. Taxi Module - taxiSavedLocations (Home location)
		const taxiLocation = {
			name: 'Home',
			coords: { lat: 0, lng: 0 }, // Default coordinates, will be updated when user selects location
			address: `${unified.addressLine1}, ${unified.city}, ${unified.state} ${unified.pincode}`
		};
		const existingTaxiLocations = parseJson(localStorage.getItem('taxiSavedLocations')) || {};
		// Only update if no home location exists
		if (!existingTaxiLocations.home) {
			existingTaxiLocations.home = taxiLocation;
			safeSetItem('taxiSavedLocations', JSON.stringify(existingTaxiLocations));
		}

		// 5. Taxi Module - recentTaxiLocations
		const recentTaxiLocation = {
			address: `${unified.addressLine1}, ${unified.city}, ${unified.state} ${unified.pincode}`,
			coordinates: [0, 0], // Default coordinates
			timestamp: Date.now()
		};
		const existingRecentLocations = parseJson(localStorage.getItem('recentTaxiLocations')) || [];
		const recentLocationExists = existingRecentLocations.some(loc => 
			loc.address === recentTaxiLocation.address
		);
		if (!recentLocationExists) {
			const updatedRecentLocations = [recentTaxiLocation, ...existingRecentLocations.slice(0, 9)]; // Keep only 10 recent
			safeSetItem('recentTaxiLocations', JSON.stringify(updatedRecentLocations));
		}

		console.log('✅ Address data synced to all modules');
		console.log('📋 Synced to: Ecommerce, Grocery, Food, Hotel, Taxi modules');
	} catch (error) {
		console.error('Failed to sync address data to modules:', error);
	}
}

export const profileService = {
	getProfile: () => {
		// Check if current user matches stored profile data
		const currentUser = getCurrentUserIdentifier();
		const storedUser = getStoredUserIdentifier();
		
		// Only clear profile data if it's a completely different user (different email)
		// Allow phone number changes for the same email address
		if (currentUser && storedUser && currentUser !== storedUser) {
			const currentEmail = currentUser.split('-')[0];
			const storedEmail = storedUser.split('-')[0];
			
			// Only clear if it's a different email address
			if (currentEmail !== storedEmail) {
				console.log('🔄 Different user detected (different email):', { currentUser, storedUser });
				console.log('🧹 Clearing old profile data for new user');
				clearAllProfileData();
				return normalizeProfile({});
			} else {
				console.log('📱 Same user, different phone number - preserving profile data:', { currentUser, storedUser });
				// Same user with different phone number - preserve profile data but update phone number
				const unifiedRaw = localStorage.getItem(UNIFIED_KEY);
				if (unifiedRaw) {
					const unified = parseJson(unifiedRaw) || {};
					// Update phone number to match current login
					const currentPhone = currentUser.split('-')[1];
					unified.phone = currentPhone;
					// Save updated profile
					localStorage.setItem(UNIFIED_KEY, JSON.stringify(unified));
					console.log('📱 Updated phone number in profile:', currentPhone);
				}
			}
		}
		
		const unifiedRaw = localStorage.getItem(UNIFIED_KEY);
		if (unifiedRaw) {
			const unified = parseJson(unifiedRaw) || {};
			return normalizeProfile(unified);
		}
		// Build from legacy if unified not present
		const { grocery, taxi, hotel, auth } = readLegacyModuleProfiles();
		const merged = mergeProfiles([grocery, taxi, hotel, auth]);
		// Persist for future fast reads (async, but don't wait)
		syncToModules(merged).catch(error => {
			console.warn('Failed to sync legacy profiles:', error);
		});
		return merged;
	},

	saveProfile: async (partialProfile) => {
		const current = profileService.getProfile();
		const next = normalizeProfile({ ...current, ...partialProfile });
		await syncToModules(next);
		return next;
	},

	// Utility function to clear old data when localStorage gets full
	clearOldData: () => {
		try {
			clearOldLocalStorageData();
			console.log('✅ Cleared old localStorage data to free up space');
			return true;
		} catch (error) {
			console.error('Failed to clear old data:', error);
			return false;
		}
	},

	// Clear all profile data for new user authentication
	clearProfileDataForNewUser: () => {
		return clearAllProfileData();
	},

	// Manually sync address data to all modules
	syncAddressToAllModules: () => {
		const currentProfile = profileService.getProfile();
		syncAddressDataToAllModules(currentProfile);
		return currentProfile;
	},

	// Check localStorage usage
	getStorageUsage: () => {
		let total = 0;
		for (let key in localStorage) {
			if (localStorage.hasOwnProperty(key)) {
				total += localStorage[key].length;
			}
		}
		return {
			totalBytes: total,
			totalMB: (total / (1024 * 1024)).toFixed(2),
			isNearLimit: total > 4 * 1024 * 1024 // 4MB warning threshold
		};
	},

	// Emergency function to clear all data if localStorage is completely full
	emergencyClear: () => {
		try {
			console.log('🚨 Emergency localStorage clear initiated...');
			localStorage.clear();
			console.log('✅ All localStorage data cleared successfully');
			return true;
		} catch (error) {
			console.error('❌ Emergency clear failed:', error);
			return false;
		}
	}
};

export default profileService;


