import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import quickLinkService from '../services/quickLinkService';

const QuickLinks = () => {
  const [quickLinks, setQuickLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // 🆕 DEMO QUICK LINKS - Remove this when real data is available
  const demoQuickLinks = [
    {
      id: 'demo-1',
      name: 'Smart Watch',
      price: 2999,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&h=150&fit=crop&crop=center',
      product_id: 'demo-product-1'
    },
    {
      id: 'demo-2',
      name: 'Wireless Earbuds',
      price: 1499,
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=150&h=150&fit=crop&crop=center',
      product_id: 'demo-product-2'
    },
    {
      id: 'demo-3',
      name: 'Laptop Bag',
      price: 899,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=150&h=150&fit=crop&crop=center',
      product_id: 'demo-product-3'
    },
    {
      id: 'demo-4',
      name: 'Power Bank',
      price: 599,
      image: 'https://images.unsplash.com/photo-1609592806596-b43bada1b0b6?w=150&h=150&fit=crop&crop=center',
      product_id: 'demo-product-4'
    }
  ];

  useEffect(() => {
    fetchQuickLinks();
  }, []);

  const fetchQuickLinks = async () => {
    try {
      setLoading(true);
      // console.log('🔍 QuickLinks: Fetching quick links...');
      
      const response = await quickLinkService.getQuickLinksWithFallback();
      // console.log('🔍 QuickLinks: API response:', response);
      
      if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
        console.log('🔍 QuickLinks: Setting quick links:', response.data);
        setQuickLinks(response.data);
      } else {
        console.log('🔍 QuickLinks: No quick links from API, using demo data');
        // 🆕 Use demo data when API returns empty
        setQuickLinks(demoQuickLinks);
      }
    } catch (err) {
      console.error('❌ QuickLinks: Error fetching quick links:', err);
      setError('Failed to load quick links');
      // 🆕 Use demo data on error
      setQuickLinks(demoQuickLinks);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLinkClick = (quickLink) => {
    // console.log('🔍 QuickLinks: Clicked quick link:', quickLink);
    
    // 🆕 Handle demo products differently
    if (quickLink.id.startsWith('demo-')) {
      // For demo products, navigate to a generic product page or show alert
      alert(`Demo Quick Link: ${quickLink.name} - ₹${quickLink.price}\n\nThis is a demo product. In production, this would navigate to the actual product page.`);
      return;
    }
    
    // Navigate to the specific product page for real products
    navigate(`/product/${quickLink.product_id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading quick links...</span>
      </div>
    );
  }

  if (error && quickLinks.length === 0) {
    // console.log('❌ QuickLinks: Error state, not showing component');
    return null; // Don't show anything if there's an error and no demo data
  }

  if (!quickLinks || quickLinks.length === 0) {
    // console.log('🔍 QuickLinks: No quick links available, not showing component');
    return null; // Don't show anything if no quick links
  }

  // console.log('🔍 QuickLinks: Rendering quick links:', quickLinks);

  return (
    <div className="bg-white py-4 px-4 rounded-lg shadow-sm border border-gray-100">
      {/* <div className="mb-3"> */}
        {/* <h3 className="text-lg font-semibold text-gray-800 mb-2">Quick Access</h3> */}
        {/* <p className="text-sm text-gray-600">Popular products for quick shopping</p> */}
      {/* </div> */}
      
      <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
        {quickLinks.map((quickLink) => (
          <div
            key={quickLink.id}
            onClick={() => handleQuickLinkClick(quickLink)}
            className="flex flex-col items-center space-y-2 min-w-[80px] cursor-pointer group"
          >
            {/* Circular Product Image */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-blue-500 transition-colors duration-200">
                <img
                  src={quickLink.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjNUMzRkZGIi8+Cjx0ZXh0IHg9IjMyIiB5PSIzMiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlByb2R1Y3Q8L3RleHQ+Cjwvc3ZnPgo='}
                  alt={quickLink.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null; // Prevent infinite loop
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjNUMzRkZGIi8+Cjx0ZXh0IHg9IjMyIiB5PSIzMiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlByb2R1Y3Q8L3RleHQ+Cjwvc3ZnPgo=';
                  }}
                />
              </div>
              
              {/* Price Badge */}
              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                ₹{quickLink.price || 0}
              </div>
            </div>
            
            {/* Product Name */}
            <div className="text-center">
              <p className="text-xs font-medium text-gray-800 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                {quickLink.name}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Debug info in development */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          {quickLinks.length} quick link(s) loaded {quickLinks.some(q => q.id.startsWith('demo-')) ? '(including demo data)' : ''}
        </div>
      )} */}
    </div>
  );
};

export default QuickLinks;
