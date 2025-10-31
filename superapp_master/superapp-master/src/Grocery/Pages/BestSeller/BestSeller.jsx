import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import star from "../../../Icons/Star.svg";
import "./BestSeller.css";
import { useNavigate } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import QuickViewModal from "../../../Components/QuickViewModal";
import { useCart } from "../../../Utility/CartContext";
import API_CONFIG from "../../../config/api.config.js";

const BestSeller = ({ product }) => {

    const navigate = useNavigate();
    const { addToCart, cart } = useCart();
    const [isLiked, setIsLiked] = useState(false);
    const [showQuickView, setShowQuickView] = useState(false);
    const [wishlistItems, setWishlistItems] = useState([]);

    // Fetch wishlist on component mount
    useEffect(() => {
        const fetchWishlist = async () => {
            try {
                const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.GROCERY_WISHLIST), {
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer demo-token'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    // Format data to match the expected structure
                    const formatted = data.map(item => {
                        const grocery = item.grocery || item;
                        return {
                            ...item,
                            id: item._id || item.id,
                            grocery_id: item.grocery_id || grocery.id,
                            name: grocery.name || item.name,
                            category: grocery.category || item.category,
                            originalPrice: parseFloat(grocery.original_price ?? item.original_price ?? item.originalPrice ?? 0),
                            discountedPrice: parseFloat(grocery.discounted_price ?? item.discounted_price ?? item.discountedPrice ?? 0),
                            image: (grocery.image || item.image)
                              ? (grocery.image || item.image).startsWith('http')
                                ? (grocery.image || item.image)
                                : API_CONFIG.getUploadUrl(grocery.image || item.image)
                              : '/placeholder-image.png'
                        };
                    });
                    setWishlistItems(formatted);
                }
            } catch (err) {
                console.error('Error loading wishlist:', err);
            }
        };
        fetchWishlist();
    }, []);

    // Check if product is in wishlist
    useEffect(() => {
        const isInWishlist = wishlistItems.some(item => 
            item.grocery_id === product.id && item.category === product.category
        );
        setIsLiked(isInWishlist);
    }, [wishlistItems, product.id, product.category]);

    // Add/remove from wishlist function
    const toggleWishlist = async () => {
        try {
            const existingItem = wishlistItems.find(item => 
                item.grocery_id === product.id && item.category === product.category
            );

            if (existingItem) {
                // Remove from wishlist
                const response = await fetch(API_CONFIG.getUrl(`/api/gwishlist/${existingItem._id || existingItem.id}`), {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer demo-token'
                    }
                });

                if (response.ok) {
                    setWishlistItems(prev => prev.filter(item => 
                        !(item.grocery_id === product.id && item.category === product.category)
                    ));
                }
            } else {
                // Add to wishlist
                const payload = {
                    grocery_id: product.id,
                    name: product.name,
                    image: product.image,
                    category: product.category,
                    original_price: product.originalPrice,
                    discounted_price: product.price,
                    quantity: 1
                };

                const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.GROCERY_WISHLIST), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer demo-token'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const newWishlistItem = {
                        id: Date.now(),
                        grocery_id: product.id,
                        name: product.name,
                        image: product.image,
                        category: product.category,
                        original_price: product.originalPrice,
                        discounted_price: product.price,
                        quantity: 1
                    };
                    setWishlistItems(prev => [...prev, newWishlistItem]);
                }
            }
        } catch (err) {
            console.error('Error updating wishlist:', err);
        }
    };

    const formatAmount = (amount) => amount.toLocaleString("en-IN");

    return (
        <div className="relative bg-white p-4 rounded-2xl border border-gray-300 shadow-md flex flex-col mx-2">
            {/* Like Button */}
            <div className="absolute top-2 right-2 z-20">
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                        isLiked 
                            ? 'bg-gradient-to-r from-red-500 to-pink-500 border-2 border-red-300 shadow-red-200 hover:shadow-red-300 hover:from-red-600 hover:to-pink-600 hover:border-red-400' 
                            : 'bg-white border-2 border-gray-300 shadow-gray-200 hover:border-red-400 hover:shadow-gray-300'
                    }`}
                    onClick={toggleWishlist}
                >
                    <Heart 
                        size={20} 
                        fill={isLiked ? "#ffffff" : "none"} 
                        stroke={isLiked ? "#ffffff" : "#9CA3AF"} 
                        className={`transition-all duration-300 ${isLiked ? 'animate-pulse' : ''}`}
                    />
                </div>
            </div>

            {/* Ribbon */}
            <div className="absolute top-0 right-0 w-[60px] h-[60px] bg-[#684DFF] clip-ribbon flex items-center justify-center rounded-tr-2xl"></div>

            {/* Product Image */}
            <div
                onClick={() => setShowQuickView(true)}
                className="relative w-[120px] h-[120px] mx-auto pt-2 flex items-center justify-center overflow-hidden rounded-md cursor-pointer"
            >
                <img src={product.image} alt={product.name} className="object-contain w-full h-full" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
            </div>

            {/* Product Info */}
            <div className="mt-3 flex flex-col items-start text-left w-full">
                {/* Badge & Rating */}
                <div className="flex items-center justify-between w-full mt-1">
                    {product.bestSeller && <p className="text-[#684DFF] text-xs font-medium">Best seller</p>}
                    <div className="flex items-center">
                        <img src={star} alt="Star" className="w-4 h-4" />
                        <span className="ml-1 text-[#242424] text-xs font-medium">{product.rating}</span>
                    </div>
                </div>

                {/* Product Name */}
                <h3 className="text-[#242424] font-medium text-sm truncate w-full">{product.name}</h3>
               
                {/* Pricing */}
                <div className="flex items-center space-x-2 mt-1">
                    <p className="text-[#242424] font-medium text-sm">₹ {formatAmount(product.price)}</p>
                    <p className="text-[#C1C1C1] line-through text-[10px]">₹{formatAmount(product.originalPrice)}</p>
                </div>

                <div className="mt-1 w-full text-center bg-[#5C3FFF] rounded-full text-white font-normal text-sm py-1">Add to Cart</div>
            </div>

            {showQuickView && (
                <QuickViewModal
                    isOpen={showQuickView}
                    onClose={() => setShowQuickView(false)}
                    product={product}
                    addToCart={(p, qty) => addToCart(p._id || p.id, qty)}
                    cartItems={cart?.items || []}
                />
            )}
        </div>
    );
};


export default BestSeller;
