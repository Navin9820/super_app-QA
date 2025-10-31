import React from 'react';
import BannerSlider from './BannerSlider.jsx';

// Default ecommerce banners (reusing Clothes Home banners)
import mensBanner from '../Clothes/Images/mens_wear_banner.jpg';
import womensBanner from '../Clothes/Images/womens_wear_banner.jpg';
import cosmeticsBanner from '../Clothes/Images/cosmetics_banner.jpg';
import homeAppliancesBanner from '../Clothes/Images/home_appliances_banner.jpeg';

/**
 * TopBannerSection
 * Reusable top-of-page banner slider for ecommerce pages
 * Props:
 * - images?: string[]
 * - autoplayDelay?: number
 * - heightClass?: string
 * - roundedClass?: string
 * - className?: string
 */
const TopBannerSection = ({
  images,
  autoplayDelay = 3000,
  heightClass = 'h-40',
  roundedClass = 'rounded-xl',
  className = ''
}) => {
  const defaultImages = [mensBanner, womensBanner, cosmeticsBanner, homeAppliancesBanner];
  return (
    <div className={className}>
      <BannerSlider
        images={images && images.length > 0 ? images : defaultImages}
        autoplayDelay={autoplayDelay}
        heightClass={heightClass}
        roundedClass={roundedClass}
      />
    </div>
  );
};

export default TopBannerSection;


