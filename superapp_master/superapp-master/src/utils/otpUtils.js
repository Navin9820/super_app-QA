// Utility function to safely extract OTP code from various OTP data structures
export const getOtpCode = (order) => {
  // Try to get OTP from various possible locations
  
  // First try direct delivery_otp field
  if (order.delivery_otp) {
    if (typeof order.delivery_otp === 'string') {
      return order.delivery_otp;
    } else if (typeof order.delivery_otp === 'object' && order.delivery_otp.code) {
      return order.delivery_otp.code;
    }
  }
  
  // Try deliveryOtp field (different naming convention)
  if (order.deliveryOtp) {
    if (typeof order.deliveryOtp === 'string') {
      return order.deliveryOtp;
    } else if (typeof order.deliveryOtp === 'object' && order.deliveryOtp.code) {
      return order.deliveryOtp.code;
    }
  }
  
  // Try payment_details.delivery_otp
  if (order.payment_details?.delivery_otp) {
    if (typeof order.payment_details.delivery_otp === 'string') {
      return order.payment_details.delivery_otp;
    } else if (typeof order.payment_details.delivery_otp === 'object' && order.payment_details.delivery_otp.code) {
      return order.payment_details.delivery_otp.code;
    }
  }
  
  // Return null if no OTP found
  return null;
};

// Check if order has any OTP data
export const hasOtp = (order) => {
  return getOtpCode(order) !== null;
};
