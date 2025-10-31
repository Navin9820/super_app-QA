import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/autoplay';

/**
 * Reusable banner slider that matches the Clothes Home page style
 * Props:
 * - images: Array<string | { image?: string, mobile_image_url?: string, src?: string }>
 * - autoplayDelay?: number (ms)
 * - heightClass?: string (Tailwind height classes for slide container)
 * - roundedClass?: string (Tailwind rounded classes)
 * - slideWrapperClass?: string (extra classes for slide wrapper)
 */
const BannerSlider = ({
  images = [],
  autoplayDelay = 3000,
  heightClass = 'h-[200px]',
  roundedClass = 'rounded-2xl',
  slideWrapperClass = ''
}) => {
  const resolveSrc = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.image || item.mobile_image_url || item.src || '';
  };

  return (
    <div className="w-full">
      <Swiper
        spaceBetween={16}
        slidesPerView="auto"
        loop={true}
        autoplay={{ delay: autoplayDelay, disableOnInteraction: false }}
        modules={[Autoplay]}
        className="!py-4 w-full"
      >
        {images.map((img, idx) => (
          <SwiperSlide key={idx} className="!w-full">
            <div className={`flex flex-col items-center w-full ${heightClass} ${roundedClass} shadow-md cursor-pointer overflow-hidden ${slideWrapperClass}`}>
              <img
                src={resolveSrc(img)}
                alt={`banner-${idx + 1}`}
                className={`w-full h-full object-cover ${roundedClass}`}
                loading="lazy"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default BannerSlider;


