import React from 'react';
import HeaderInsideTaxi from '../ComponentsTaxi/HeaderInsideTaxi';

export default function Help() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      <HeaderInsideTaxi />
      <div className="pt-20 pb-8 px-2 w-full flex justify-center items-start">
        <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl p-4 sm:p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-blue-700 text-center">Help & Support</h1>
          
          {/* Quick Help Categories */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-2xl mb-1">🚗</div>
              <div className="text-sm font-medium text-blue-800">Booking Help</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-2xl mb-1">💳</div>
              <div className="text-sm font-medium text-green-800">Payment Issues</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg text-center">
              <div className="text-2xl mb-1">🛡️</div>
              <div className="text-sm font-medium text-orange-800">Safety Concerns</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <div className="text-2xl mb-1">📱</div>
              <div className="text-sm font-medium text-purple-800">App Problems</div>
            </div>
          </div>

          {/* Booking & Ride FAQs */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-blue-600">🚗 Booking & Rides</h2>
            <ul className="space-y-4">
              <li>
                <strong className="text-gray-800">How do I book a ride?</strong>
                <div className="text-gray-600 mt-1">Enter your pickup and destination, select your preferred vehicle type (Auto, Bike, Car, SUV), and confirm your booking. You'll see the fare estimate before booking.</div>
              </li>
              <li>
                <strong className="text-gray-800">How do I cancel a ride?</strong>
                <div className="text-gray-600 mt-1">Go to 'My Rides', select your active ride, and tap 'Cancel Ride'. Cancellation charges may apply based on timing.</div>
              </li>
              <li>
                <strong className="text-gray-800">Can I book a ride in advance?</strong>
                <div className="text-gray-600 mt-1">Yes! Use the 'Schedule Ride' option to book rides up to 7 days in advance. Perfect for airport transfers and important meetings.</div>
              </li>
              <li>
                <strong className="text-gray-800">What if my driver doesn't arrive?</strong>
                <div className="text-gray-600 mt-1">Contact the driver directly through the app or call our support. We'll arrange an alternative ride or provide a full refund.</div>
              </li>
              <li>
                <strong className="text-gray-800">Can I change my destination after booking?</strong>
                <div className="text-gray-600 mt-1">Yes, you can modify your destination through the app before the ride starts. Additional charges may apply for longer distances.</div>
              </li>
            </ul>
          </div>

          {/* Payment FAQs */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-green-600">💳 Payment & Billing</h2>
            <ul className="space-y-4">
              <li>
                <strong className="text-gray-800">How do I pay for my ride?</strong>
                <div className="text-gray-600 mt-1">Choose from Cash, UPI, Credit/Debit Cards, or Digital Wallet. Set your preferred payment method in settings for faster booking.</div>
              </li>
              <li>
                <strong className="text-gray-800">Why was I charged extra?</strong>
                <div className="text-gray-600 mt-1">Extra charges may apply for tolls, waiting time, night surcharge (10 PM - 6 AM), or peak hour pricing. Check your ride receipt for details.</div>
              </li>
              <li>
                <strong className="text-gray-800">How do I get a ride receipt?</strong>
                <div className="text-gray-600 mt-1">Go to 'My Rides', select your completed ride, and tap 'Download Receipt'. You'll receive it via email and SMS.</div>
              </li>
              <li>
                <strong className="text-gray-800">Can I split the fare with friends?</strong>
                <div className="text-gray-600 mt-1">Yes! Use the 'Split Fare' option to divide the cost among multiple passengers. Each person pays their share directly.</div>
              </li>
            </ul>
          </div>

          {/* Safety & Lost Items */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-orange-600">🛡️ Safety & Lost Items</h2>
            <ul className="space-y-4">
              <li>
                <strong className="text-gray-800">I lost an item in the cab. What should I do?</strong>
                <div className="text-gray-600 mt-1">Go to 'My Rides', select the ride, and tap 'Report Lost Item'. Our support team will contact the driver and help recover your item.</div>
              </li>
              <li>
                <strong className="text-gray-800">How do I share my ride with family?</strong>
                <div className="text-gray-600 mt-1">Use the 'Share Ride' feature to send live location updates to your emergency contacts. They can track your journey in real-time.</div>
              </li>
              <li>
                <strong className="text-gray-800">What if I feel unsafe during the ride?</strong>
                <div className="text-gray-600 mt-1">Use the SOS button in the app or call our emergency helpline. We'll immediately connect you with local authorities and track your location.</div>
              </li>
              <li>
                <strong className="text-gray-800">How do I verify my driver?</strong>
                <div className="text-gray-600 mt-1">Check the driver's photo, name, and vehicle details in the app. Never board a vehicle that doesn't match the app details.</div>
              </li>
            </ul>
          </div>

          {/* App & Technical Issues */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-purple-600">📱 App & Technical Issues</h2>
            <ul className="space-y-4">
              <li>
                <strong className="text-gray-800">App is not working or keeps crashing.</strong>
                <div className="text-gray-600 mt-1">Try restarting the app, clearing cache, or updating to the latest version. Ensure you have a stable internet connection.</div>
              </li>
              <li>
                <strong className="text-gray-800">GPS is not working properly.</strong>
                <div className="text-gray-600 mt-1">Enable location services, check GPS settings, and ensure you're in an area with good signal. Try moving to an open area.</div>
              </li>
              <li>
                <strong className="text-gray-800">I can't see any drivers nearby.</strong>
                <div className="text-gray-600 mt-1">This could be due to high demand or limited availability in your area. Try different vehicle types or wait a few minutes.</div>
              </li>
              <li>
                <strong className="text-gray-800">How do I update my profile?</strong>
                <div className="text-gray-600 mt-1">Go to 'Account' → 'Profile' to update your name, phone number, or profile picture. Changes may take a few minutes to reflect.</div>
              </li>
            </ul>
          </div>
          {/* Emergency Contacts */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-red-600">🚨 Emergency Contacts</h2>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-sm text-red-800 mb-2">
                <strong>Emergency Helpline:</strong> 24/7 Support
              </div>
              <div className="text-red-700 font-semibold text-lg">1800-123-4567</div>
              <div className="text-xs text-red-600 mt-1">
                Available 24/7 for immediate assistance
              </div>
            </div>
          </div>

          {/* Contact Support Information */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-3 text-blue-600">📞 Contact Support</h2>
            <div className="grid grid-cols-1 gap-3 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-1">Email Support</div>
                <div className="text-blue-700 text-sm">support@superapp.com</div>
                <div className="text-xs text-blue-600 mt-1">For detailed inquiries and documentation</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-green-800 mb-1">WhatsApp Support</div>
                <div className="text-green-700 text-sm">+91 98765 43210</div>
                <div className="text-xs text-green-600 mt-1">For quick assistance and chat support</div>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-700">
                <strong>Support Hours:</strong> 24/7 Emergency Support<br/>
                <strong>Response Time:</strong> 2-5 minutes for urgent issues<br/>
                <strong>Languages:</strong> English, Hindi, Tamil, Telugu
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 