import axios from 'axios';
import API_CONFIG from '../config/api.config';

const quickLinkService = {
  // Get all active quick links for frontend display
  getQuickLinks: async () => {
    try {
      console.log('🔍 QuickLinks Service: Fetching from:', `${API_CONFIG.BASE_URL}/api/quick-links`);
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/quick-links`);
      console.log('🔍 QuickLinks Service: Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ QuickLinks Service: Error fetching quick links:', error);
      throw error;
    }
  },

  // Get quick links with fallback to demo data
  getQuickLinksWithFallback: async () => {
    try {
      console.log('🔍 QuickLinks Service: Fetching with fallback from:', `${API_CONFIG.BASE_URL}/api/quick-links`);
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/quick-links`);
      // console.log('🔍 QuickLinks Service: Fallback response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ QuickLinks Service: Error fetching quick links, using fallback:', error);
      // Return empty array as fallback
      return {
        success: true,
        data: [],
        message: 'Using fallback data - no quick links available'
      };
    }
  }
};

export default quickLinkService;
