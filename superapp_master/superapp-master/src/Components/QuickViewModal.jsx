import React, { useEffect, useMemo, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Star } from 'lucide-react';

function getProductImages(product) {
    if (!product) return [];
    
    // ✅ ADDED: Prioritize the new images array from our backend
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        // Convert relative paths to full URLs if needed
        return product.images.map(img => {
            if (img.startsWith('http')) return img;
            if (img.startsWith('/uploads/')) {
                // For localhost development
                if (window.location.host.includes('localhost')) {
                    const localBackendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
                    return `${localBackendUrl}${img}`;
                }
                // For production - use environment variable or fallback
                const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
                return `${backendUrl}${img}`;
            }
            return img;
        });
    }
    
    const candidates = [
        product.images,
        product.photos,
        product.gallery,
        product.imageUrls,
        product.media,
    ].filter(Boolean);

    let images = [];
    for (const c of candidates) {
        if (Array.isArray(c) && c.length > 0) {
            // Normalize array of strings or objects
            const normalized = c.map((item) => {
                if (!item) return null;
                if (typeof item === 'string') return item;
                if (item.url) return item.url;
                if (item.src) return item.src;
                return null;
            }).filter(Boolean);
            images = images.concat(normalized);
        }
    }

    if (product.image) images.unshift(product.image);
    if (product.thumbnail) images.unshift(product.thumbnail);

    // De-duplicate while preserving order
    const seen = new Set();
    const unique = [];
    for (const img of images) {
        if (!seen.has(img)) {
            seen.add(img);
            unique.push(img);
        }
    }
    return unique.length > 0 ? unique : [
        'https://via.placeholder.com/600x400?text=No+Image'
    ];
}

const QuickViewModal = ({ isOpen, onClose, product, addToCart, cartItems }) => {
    const images = useMemo(() => getProductImages(product), [product]);
    const [index, setIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [localInCart, setLocalInCart] = useState(false);
    const hasMultiple = images.length > 1;

    // Check if product is already in cart (robust across shapes)
    const isInCart = (() => {
        try {
            const targetId = product?._id || product?.id;
            if (!targetId || !Array.isArray(cartItems)) return false;
            return cartItems.some((cartItem) => {
                const fromObject = typeof cartItem?.product_id === 'object' ? (cartItem.product_id?._id || cartItem.product_id?.id) : null;
                const candidate = fromObject || cartItem?.product_id || cartItem?.productId || cartItem?.id;
                return candidate === targetId;
            });
        } catch (_) {
            return false;
        }
    })();

    useEffect(() => {
        if (isOpen) {
            setIndex(0);
            setQuantity(1);
            setLocalInCart(false);
        }
    }, [isOpen, product]);

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

    const handleAddToCart = () => {
        if (addToCart && product) {
            addToCart(product, quantity);
            setLocalInCart(true);
        }
    };

    const calculateDiscount = () => {
        if (!product?.originalPrice || !product?.price) return null;
        return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    };

    if (!isOpen) return null;

    const goPrev = () => {
        if (!hasMultiple) return;
        setIndex((i) => (i - 1 + images.length) % images.length);
    };
    const goNext = () => {
        if (!hasMultiple) return;
        setIndex((i) => (i + 1) % images.length);
    };

    const discount = calculateDiscount();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-[101] w-[92vw] max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h2 className="text-lg font-semibold">Quick View</h2>
                    <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
                        <X size={18} />
                    </button>
                </div>

                {/* Image Carousel */}
                <div className="relative w-full h-64 bg-gray-50">
                    <img
                        src={images[index]}
                        alt={product?.name || 'Product'}
                        className="w-full h-full object-cover"
                        draggable={false}
                        onError={(e) => {
                            e.target.src = '/placeholder-image.png';
                        }}
                    />

                    {/* Arrows - always rendered; disabled when single image */}
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

                    {/* Dots */}
                    <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center">
                        <div className="px-2 py-1 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center gap-2">
                            {(hasMultiple ? images : [images[0]]).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => hasMultiple && setIndex(i)}
                                    className={`w-3 h-3 rounded-full transition-all ${i === index ? 'bg-green-600' : 'bg-gray-300'} ${hasMultiple ? '' : 'cursor-default'}`}
                                    aria-label={`Go to image ${i + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div className="px-4 py-3 space-y-3">
                    <h3 className="text-xl font-semibold text-gray-900">{product?.name || 'Product'}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Star size={16} className="text-yellow-500" />
                        <span>{product?.rating || '4.6'}</span>
                        <span className="text-gray-400">•</span>
                        <span>{product?.shortDescription || product?.description || 'Quick details about this product.'}</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                        {product?.price != null && (
                            <div className="text-2xl font-bold text-green-700">₹{Number(product.price).toLocaleString('en-IN')}</div>
                        )}
                        {product?.originalPrice != null && (
                            <div className="text-sm text-gray-400 line-through">₹{Number(product.originalPrice).toLocaleString('en-IN')}</div>
                        )}
                        {discount && (
                            <div className="text-sm text-green-600 font-medium">{discount}% off</div>
                        )}
                    </div>

                    {/* Add to Cart Section */}
                    {addToCart && (
                        <div className="flex flex-row items-center gap-2 w-full justify-between">
                            <button
                                className={`text-white font-medium py-2 px-4 rounded-md text-sm w-24 flex-shrink-0 ${localInCart || isInCart ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                                onClick={handleAddToCart}
                                disabled={localInCart || isInCart}
                            >
                                {localInCart || isInCart ? 'Added' : 'Add to Cart'}
                            </button>
                            <div className="flex items-center space-x-1 flex-shrink-0 justify-end">
                                <span className="text-sm font-medium text-gray-700">Qty:</span>
                                <div className="flex items-center border rounded px-1 py-1 bg-white">
                                    <button
                                        type="button"
                                        className="px-2 text-sm font-bold text-gray-700 disabled:text-gray-300"
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        disabled={quantity <= 1 || isInCart}
                                    >-</button>
                                    <span className="mx-2 w-6 text-center select-none text-sm">{quantity}</span>
                                    <button
                                        type="button"
                                        className="px-2 text-sm font-bold text-gray-700 disabled:text-gray-300"
                                        onClick={() => setQuantity(q => Math.min(10, q + 1))}
                                        disabled={quantity >= 10 || isInCart}
                                    >+</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuickViewModal;


