import React, { useState, useRef } from 'react';
import plus from "../../Icons/plus.svg";

const ProfileImageUpload = ({ 
    currentImage, 
    onImageChange, 
    size = "50px", 
    showUploadButton = true,
    className = "",
    onError = null
}) => {
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    // Image compression function
    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Set maximum dimensions
                    const MAX_WIDTH = 300;
                    const MAX_HEIGHT = 300;
                    
                    let { width, height } = img;
                    
                    // Calculate new dimensions
                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw and compress
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob(resolve, 'image/jpeg', 0.8);
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    };

    // Handle image upload
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            const errorMsg = 'Please select a valid image file (JPEG, PNG, GIF)';
            console.error(errorMsg);
            if (onError) onError(errorMsg);
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            const errorMsg = 'Image size should be less than 5MB';
            console.error(errorMsg);
            if (onError) onError(errorMsg);
            return;
        }

        setIsUploading(true);
        try {
            const compressedBlob = await compressImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                onImageChange(reader.result);
                setIsUploading(false);
            };
            reader.onerror = () => {
                setIsUploading(false);
                const errorMsg = 'Failed to process image';
                console.error(errorMsg);
                if (onError) onError(errorMsg);
            };
            reader.readAsDataURL(compressedBlob);
        } catch (error) {
            setIsUploading(false);
            const errorMsg = 'Failed to process image: ' + error.message;
            console.error(errorMsg);
            if (onError) onError(errorMsg);
        }
    };

    const handleClick = () => {
        if (showUploadButton && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div 
            className={`relative ${className}`} 
            style={{ width: size, height: size }}
        >
            {currentImage ? (
                <img 
                    src={currentImage} 
                    alt="Profile" 
                    className="rounded-full w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback to default icon if image fails to load
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }}
                />
            ) : null}
            
            {(!currentImage || isUploading) && (
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                    <svg width="24" height="24" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="4"/>
                        <path d="M4 20c0-4 8-4 8-4s8 0 8 4"/>
                    </svg>
                </div>
            )}
            
            {isUploading && (
                <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
            )}
            
            {showUploadButton && (
                <>
                    <label 
                        htmlFor="profile-image-upload" 
                        className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#5C3FFF] flex items-center justify-center cursor-pointer hover:bg-[#4A2FE8] transition-colors shadow-lg"
                        style={{ height: '18px', width: '18px' }}
                        onClick={handleClick}
                        title="Upload profile picture"
                    >
                        <img src={plus} alt="Plus" className="w-3 h-3" />
                    </label>
                    <input
                        id="profile-image-upload"
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                </>
            )}
        </div>
    );
};

export default ProfileImageUpload;
