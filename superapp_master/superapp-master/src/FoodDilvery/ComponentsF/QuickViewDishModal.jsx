import React, { useEffect, useMemo, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFoodCart } from '../../Utility/FoodCartContext';
import { formatImageUrl, formatCurrency } from '../../services/foodDeliveryService';
import { useNavigate } from 'react-router-dom';

const QuickViewDishModal = ({ isOpen, onClose, dish }) => {
  const { addToFoodCart, forceAddToFoodCart, foodCart } = useFoodCart();
  const navigate = useNavigate();
  const [showConflict, setShowConflict] = useState(false);
  const [index, setIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [localAdded, setLocalAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const images = useMemo(() => {
    if (!dish) return [];
    const list = [];
    if (Array.isArray(dish.images) && dish.images.length > 0) {
      dish.images.forEach((img) => list.push(formatImageUrl(img)));
    }
    if (dish.image) {
      list.unshift(formatImageUrl(dish.image));
    }
    return list.length > 0 ? list : ['/placeholder-image.png'];
  }, [dish]);

  const hasMultiple = images.length > 1;

  const isInCart = useMemo(() => {
    try {
      if (!dish?._id || !foodCart?.items) return false;
      return foodCart.items.some((item) => {
        const id = typeof item.dish_id === 'object' ? (item.dish_id?._id || item.dish_id?.id) : item.dish_id;
        return id === dish._id;
      });
    } catch (_) {
      return false;
    }
  }, [dish, foodCart]);

  useEffect(() => {
    if (isOpen) {
      setIndex(0);
      setQuantity(1);
      setLocalAdded(false);
      setIsAdding(false);
    }
  }, [isOpen, dish]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % images.length);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, images.length, onClose]);

  const handleAddToCart = async () => {
    const dishId = dish?._id || dish?.id;
    if (!dishId) {
      alert('Unable to add item: invalid dish id');
      return;
    }
    setIsAdding(true);
    try {
      const res = await addToFoodCart(dishId, quantity);
      if (res?.success) {
        setLocalAdded(true);
        setQuantity(1); // Reset quantity for next add
      } else if (res?.code === 'VENDOR_CONFLICT') {
        setShowConflict(true);
      } else {
        alert(res?.message || 'Failed to add to cart');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const confirmSwitchRestaurant = async () => {
    if (!dish?._id && !dish?.id) return setShowConflict(false);
    setIsAdding(true);
    try {
      const res = await forceAddToFoodCart(dish._id || dish.id, quantity);
      if (!res?.success) alert(res?.message || 'Failed to add to cart');
      setShowConflict(false);
      setQuantity(1);
      setLocalAdded(true); // Show "View Cart" after clearing cart
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen || !dish) return null;

  const goPrev = () => {
    if (!hasMultiple) return;
    setIndex((i) => (i - 1 + images.length) % images.length);
  };
  const goNext = () => {
    if (!hasMultiple) return;
    setIndex((i) => (i + 1) % images.length);
  };

  const effectivePrice = dish.sale_price || dish.price || 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-[101] w-[92vw] max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Quick View</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="relative w-full h-64 bg-gray-50">
          <img
            src={images[index]}
            alt={dish?.name || 'Dish'}
            className="w-full h-full object-cover"
            draggable={false}
          />

          <button
            className={`absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-3 shadow ring-1 ring-black/10 ${hasMultiple ? 'bg-black/60 hover:bg-black/70 text-white' : 'bg-black/20 text-white opacity-50 cursor-not-allowed'}`}
            onClick={goPrev}
            aria-label="Previous image"
            disabled={!hasMultiple}
          >
            <ChevronLeft size={22} className="pointer-events-none" />
          </button>
          <button
            className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-3 shadow ring-1 ring-black/10 ${hasMultiple ? 'bg-black/60 hover:bg-black/70 text-white' : 'bg-black/20 text-white opacity-50 cursor-not-allowed'}`}
            onClick={goNext}
            aria-label="Next image"
            disabled={!hasMultiple}
          >
            <ChevronRight size={22} className="pointer-events-none" />
          </button>
        </div>

        <div className="px-4 py-3 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">{dish?.name || 'Dish'}</h3>
          <div className="text-sm font-semibold text-gray-600 leading-relaxed">
            <p className="line-clamp-4">
              {(() => {
                // Always use the full default description if the existing description is too short or empty
                const existingDesc = dish?.description;
                if (!existingDesc || existingDesc.length < 20 || existingDesc.length === 1) {
                  return `${dish?.name || 'This dish'} is a delicious and flavorful dish prepared with fresh ingredients and authentic spices. This mouth-watering recipe combines traditional cooking methods with modern presentation, creating a perfect balance of taste and nutrition. Each bite offers a burst of flavors that will satisfy your cravings and leave you wanting more.`;
                }
                return existingDesc;
              })()}
            </p>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-sm font-semibold text-black-600">{formatCurrency(effectivePrice)}</div>
            {dish?.price && dish?.price > effectivePrice && (
              <div className="text-sm font-semibold text-blue-600 line-through">{formatCurrency(dish.price)}</div>
            )}
          </div>

          <div className="flex flex-row items-center gap-2 w-full justify-between">
            <button
              className={`text-white text-sm font-semibold py-2 px-4 rounded-md w-28 flex-shrink-0 ${isAdding ? 'bg-gray-400 cursor-not-allowed' : localAdded ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              onClick={localAdded ? () => navigate('/home-food/cart') : handleAddToCart}
              disabled={isAdding}
            >
              {isAdding ? 'Adding...' : localAdded ? 'View Cart' : isInCart ? 'Add More' : 'Add to Cart'}
            </button>
            <div className="flex items-center space-x-1 flex-shrink-0 justify-end">
              <span className="text-sm font-semibold text-gray-700">Qty:</span>
              <div className="flex items-center border rounded px-1 py-1 bg-white">
                <button
                  type="button"
                  className="px-2 text-sm font-semibold text-gray-700 disabled:text-gray-300"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >-</button>
                <span className="mx-2 w-6 text-center select-none text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  className="px-2 text-sm font-semibold text-gray-700 disabled:text-gray-300"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  disabled={quantity >= 10}
                >+</button>
              </div>
            </div>
          </div>
          {showConflict && (
            <div className="mt-3 p-3 border rounded-lg bg-blue-50 text-sm font-semibold text-blue-700">
              <div className="mb-2">You can only order from one restaurant at a time. Clear cart and add this item?</div>
              <div className="flex gap-2">
                <button onClick={() => setShowConflict(false)} className="px-3 py-1 border rounded text-sm font-semibold">Cancel</button>
                <button onClick={confirmSwitchRestaurant} className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-semibold">Clear & Add</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickViewDishModal;