import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Star, Clock, MapPin } from 'lucide-react';
import HeaderF from '../ComponentsF/HeaderF'; // Import HeaderF
import FooterFood from '../ComponentsF/FooterFood';
import mainBanner1 from '../ImagesF/main-banner1.jpg';

const restaurants = [
  {
    id: 1,
    name: 'Tandoori Tadka',
     image: "https://images.deliveryhero.io/image/talabat/MenuItems/mmw_637991046790734061",
    rating: 4.5,
    time: '35-45 mins',
    cuisines: ['North Indian', 'Tandoori', 'Mughlai'],
    location: 'Anna Nagar',
    offer: null,
    distance: '3.2 km',
    minOrder: 200
  },
  {
    id: 2,
    name: 'Madras Cafe',
    image: 'https://rs-menus-api.roocdn.com/images/b2c2154d-821c-49ff-b6bd-4f51eca6a1b9/image.jpeg?width=1200&height=630&fit=crop',
    rating: 4.5,
    time: '35-45 mins',
    cuisines: ['South Indian', 'Dosai', 'Idli', 'Vada'],
    location: 'T. Nagar',
    offer: '20% OFF ABOVE ₹299',
    distance: '2.8 km',
    minOrder: 150
  },
  {
    id: 3,
    name: 'Spice Route',
    image: 'https://spiceroutegourmet.com.au/assets/images/slider/slidernew.jpg',
    rating: 4.2,
    time: '30-40 mins',
    cuisines: ['South Indian', 'Chettinad', 'Vegetarian'],
    location: 'Velachery',
    offer: '₹165 OFF ABOVE ₹649',
    distance: '4.1 km',
    minOrder: 300
  },
  {
    id: 4,
    name: 'Street Eats',
    image: 'https://www.streeteats.com.au/wp-content/uploads/2022/10/sreet-eats-food-trucks.png',
    rating: 4.0,
    time: '25-35 mins',
    cuisines: ['Street Food', 'Chaat', 'Fast Food'],
    location: 'Mylapore',
    offer: '₹120 OFF ABOVE ₹499',
    distance: '1.5 km',
    minOrder: 100
  }
];

function RestaurantDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Try to get category name from location.state, fallback to params, fallback to 'Indian'
  const categoryName = location.state?.categoryName || params.restaurentCategoryName || 'Indian';

  const handleRestaurantClick = (restaurantId) => {
    navigate(`/home-food/restaurent-list-based-on-category/${encodeURIComponent(categoryName)}/restaurant/${restaurantId}`);
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Header */}
      <HeaderF />

      {/* Banner/Hero Section */}
      <div className="w-full max-w-6xl mx-auto px-4 pt-28 md:pt-24"> {/* Adjusted padding for header */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg h-48 md:h-64 flex items-center bg-gradient-to-r from-green-600/80 to-green-400/60 mb-8">
          <img
            src={mainBanner1}
            alt="Indian Food Banner"
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
          <div className="relative z-10 flex flex-col justify-center h-full px-8 md:px-16">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-2">
              Top {categoryName} Restaurants
            </h1>
            <p className="text-lg md:text-2xl text-white font-medium drop-shadow">
              Enjoy the best food near you, delivered fast!
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 pb-28 md:px-6 lg:px-8">
        <h2 className="text-2xl font-bold mb-6 text-green-700">Top {categoryName} Restaurants</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="bg-white rounded-2xl p-4 shadow hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full"
              onClick={() => handleRestaurantClick(restaurant.id)}
              role="button"
              tabIndex={0}
              aria-label={`View details for ${restaurant.name}`}
              onKeyDown={(e) => e.key === 'Enter' && handleRestaurantClick(restaurant.id)}
            >
              <div className="relative w-full h-40 mb-4 rounded-xl overflow-hidden">
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
                {restaurant.offer && (
                  <span className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    {restaurant.offer}
                  </span>
                )}
              </div>
              <div className="flex-1 flex flex-col">
                <h3 className="font-semibold text-lg text-gray-800 mb-1">{restaurant.name}</h3>
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(restaurant.rating) ? 'fill-green-500 text-green-500' : 'fill-gray-300 text-gray-300'}
                      aria-hidden="true"
                    />
                  ))}
                  <span className="text-gray-600 ml-1">({restaurant.rating})</span>
                </div>
                <div className="flex items-center gap-4 text-gray-600 text-sm mb-2">
                  <div className="flex items-center">
                    <Clock size={16} className="mr-1" aria-hidden="true" />
                    <span>{restaurant.time}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-1" aria-hidden="true" />
                    <span>{restaurant.distance}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {restaurant.cuisines?.map((cuisine, index) => (
                    <span key={index} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      {cuisine}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <FooterFood />
    </div>
  );
}

export default RestaurantDetails;