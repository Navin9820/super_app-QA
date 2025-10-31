import React from 'react';
import HeaderInsideTaxi from '../ComponentsTaxi/HeaderInsideTaxi';
import FooterTaxi from "../ComponentsTaxi/FooterTaxi";

export default function PowerPass() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      <HeaderInsideTaxi />
      <div className="pt-20 pb-8 px-2 w-full flex justify-center items-start">
        <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl p-4 sm:p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-blue-700 text-center">Power Pass</h1>
          
          {/* Power Pass Overview */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border border-blue-200">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">⚡</div>
              <div className="font-bold text-lg text-blue-800">Unlock Premium Benefits</div>
              <div className="text-sm text-blue-600">Save more on every ride with Power Pass</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-green-600">₹299</div>
                <div className="text-xs text-gray-600">Monthly</div>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-blue-600">₹2,999</div>
                <div className="text-xs text-gray-600">Yearly (Save ₹600)</div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-blue-600">🚀 How Power Pass Works</h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">Subscribe to Power Pass</div>
                  <div className="text-sm text-gray-600">Choose monthly or yearly plan with instant activation</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">Enjoy Premium Benefits</div>
                  <div className="text-sm text-gray-600">Get discounts, priority support, and exclusive offers</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">✓</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">Cancel Anytime</div>
                  <div className="text-sm text-gray-600">No hidden charges, cancel whenever you want</div>
                </div>
              </div>
            </div>
          </div>
          {/* Power Pass Benefits */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-green-600">🎁 Power Pass Benefits</h2>
            <div className="space-y-3">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-green-800">15% Ride Discount</div>
                    <div className="text-sm text-green-600">On all rides, every day</div>
                  </div>
                  <div className="text-green-600 font-bold">💰</div>
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-blue-800">Priority Support</div>
                    <div className="text-sm text-blue-600">24/7 dedicated support line</div>
                  </div>
                  <div className="text-blue-600 font-bold">📞</div>
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-purple-800">Free Cancellations</div>
                    <div className="text-sm text-purple-600">No cancellation charges</div>
                  </div>
                  <div className="text-purple-600 font-bold">✅</div>
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-orange-800">Exclusive Offers</div>
                    <div className="text-sm text-orange-600">Special deals and promotions</div>
                  </div>
                  <div className="text-orange-600 font-bold">🎯</div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-blue-600">📊 Compare Plans</h2>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-3 gap-0">
                <div className="bg-gray-50 p-3 text-center border-r border-gray-200">
                  <div className="font-semibold text-gray-800">Feature</div>
                </div>
                <div className="bg-gray-50 p-3 text-center border-r border-gray-200">
                  <div className="font-semibold text-gray-800">Regular</div>
                </div>
                <div className="bg-blue-50 p-3 text-center">
                  <div className="font-semibold text-blue-800">Power Pass</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-0 border-t border-gray-200">
                <div className="p-3 border-r border-gray-200">Ride Discount</div>
                <div className="p-3 text-center border-r border-gray-200">0%</div>
                <div className="p-3 text-center bg-blue-50 font-semibold text-blue-800">15%</div>
              </div>
              <div className="grid grid-cols-3 gap-0 border-t border-gray-200">
                <div className="p-3 border-r border-gray-200">Priority Support</div>
                <div className="p-3 text-center border-r border-gray-200">❌</div>
                <div className="p-3 text-center bg-blue-50 font-semibold text-blue-800">✅</div>
              </div>
              <div className="grid grid-cols-3 gap-0 border-t border-gray-200">
                <div className="p-3 border-r border-gray-200">Free Cancellations</div>
                <div className="p-3 text-center border-r border-gray-200">❌</div>
                <div className="p-3 text-center bg-blue-50 font-semibold text-blue-800">✅</div>
              </div>
              <div className="grid grid-cols-3 gap-0 border-t border-gray-200">
                <div className="p-3 border-r border-gray-200">Exclusive Offers</div>
                <div className="p-3 text-center border-r border-gray-200">❌</div>
                <div className="p-3 text-center bg-blue-50 font-semibold text-blue-800">✅</div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-blue-600">❓ Frequently Asked Questions</h2>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-800 mb-1">Can I cancel Power Pass anytime?</div>
                <div className="text-sm text-gray-600">Yes, you can cancel anytime from your account settings with no penalties.</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-800 mb-1">Are there any hidden charges?</div>
                <div className="text-sm text-gray-600">No, all charges are transparent. You only pay the subscription fee.</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-800 mb-1">When do I get the benefits?</div>
                <div className="text-sm text-gray-600">Benefits are activated immediately after successful payment.</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button className="w-full px-6 py-3 bg-blue-600 text-white rounded font-semibold shadow hover:bg-blue-500 transition">Buy Power Pass - ₹299/month</button>
            <button className="w-full px-6 py-3 bg-green-600 text-white rounded font-semibold shadow hover:bg-green-500 transition">Buy Yearly - ₹2,999 (Save ₹600)</button>
          </div>
          
          <div className="text-center mt-4">
            <a href="#" className="text-blue-600 underline text-sm">Power Pass Terms & Conditions</a>
          </div>
        </div>
      </div>
      <FooterTaxi />
    </div>
  );
} 