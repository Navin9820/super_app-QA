import React from 'react';

const ProfileImageDisplay = ({ 
    image, 
    size = "50px", 
    className = "" 
}) => {
    return (
        <div 
            className={`rounded-full bg-gray-100 flex items-center justify-center ${className}`} 
            style={{ width: size, height: size }}
        >
            {image ? (
                <img 
                    src={image} 
                    alt="Profile" 
                    className="rounded-full w-full h-full object-cover"
                />
            ) : (
                <svg width="24" height="24" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20c0-4 8-4 8-4s8 0 8 4"/>
                </svg>
            )}
        </div>
    );
};

export default ProfileImageDisplay;
