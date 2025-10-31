import React from 'react';
import HeaderInsideTaxi from '../ComponentsTaxi/HeaderInsideTaxi';
import FooterTaxi from "../ComponentsTaxi/FooterTaxi";

export default function Claims() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      <HeaderInsideTaxi />
      <div className="pt-20 pb-8 px-2 w-full flex justify-center items-start">
        <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl p-4 sm:p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-blue-700 text-center">Claims & Support</h1>
          
          {/* Quick Claim Options */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-red-50 p-3 rounded-lg text-center border border-red-200">
              <div className="text-2xl mb-1">🚗</div>
              <div className="text-sm font-medium text-red-800">Ride Issues</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg text-center border border-orange-200">
              <div className="text-2xl mb-1">💳</div>
              <div className="text-sm font-medium text-orange-800">Payment Issues</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-200">
              <div className="text-2xl mb-1">📱</div>
              <div className="text-sm font-medium text-blue-800">App Problems</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center border border-green-200">
              <div className="text-2xl mb-1">🛡️</div>
              <div className="text-sm font-medium text-green-800">Safety Issues</div>
            </div>
          </div>

          <div className="mb-4 text-center">If you faced any issues with your ride, you can raise a claim below:</div>
          
          {/* Claim Form */}
          <form className="space-y-4 mb-6">
            <div>
              <label className="block mb-1 font-medium text-gray-700">Ride ID</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter Ride ID (e.g., RIDE123456)" />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Issue Type</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Select issue type</option>
                <option>Driver didn't arrive</option>
                <option>Payment not processed</option>
                <option>Lost item in vehicle</option>
                <option>Fare discrepancy</option>
                <option>Poor service</option>
                <option>Safety concern</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Description</label>
              <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" rows="4" placeholder="Please describe your issue in detail..."></textarea>
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Contact Number</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Your contact number" />
            </div>
            <button className="w-full px-6 py-3 bg-red-500 text-white rounded-lg font-semibold shadow hover:bg-red-600 transition">Submit Claim</button>
          </form>
          {/* Claim Status */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-blue-600">📊 Claim Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Ride #12345</div>
                    <div className="text-xs text-gray-500">Driver didn't arrive</div>
                  </div>
                </div>
                <div className="text-green-600 font-semibold">Resolved</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 font-bold text-sm">⏳</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Ride #12346</div>
                    <div className="text-xs text-gray-500">Payment issue</div>
                  </div>
                </div>
                <div className="text-yellow-600 font-semibold">Pending</div>
              </div>
            </div>
          </div>

          {/* Common Issues */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-blue-600">🔧 Common Issues</h2>
            <div className="space-y-2">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-800 mb-1">Driver did not arrive</div>
                <div className="text-sm text-gray-600">We'll arrange an alternative ride or provide a full refund</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-800 mb-1">Payment not processed</div>
                <div className="text-sm text-gray-600">Check your payment method or contact your bank</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-800 mb-1">Lost item in vehicle</div>
                <div className="text-sm text-gray-600">We'll contact the driver to help recover your item</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-800 mb-1">Fare discrepancy</div>
                <div className="text-sm text-gray-600">We'll review the route and adjust the fare if needed</div>
              </div>
            </div>
          </div>

          {/* Previous Claims */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-blue-600">📋 My Previous Claims</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">Ride #12222</div>
                    <div className="text-xs text-gray-500">Dec 10, 2024</div>
                  </div>
                </div>
                <div className="text-green-600 font-semibold text-sm">Resolved</div>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-xs">✗</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">Ride #12223</div>
                    <div className="text-xs text-gray-500">Dec 8, 2024</div>
                  </div>
                </div>
                <div className="text-red-600 font-semibold text-sm">Rejected</div>
              </div>
            </div>
          </div>

          {/* Support Options */}
          <div className="mt-8 space-y-3">
            <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-500 transition">Contact Support</button>
            <button className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-500 transition">Live Chat</button>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Emergency Support</div>
              <a href="tel:18001234567" className="text-red-600 font-semibold">1800-123-4567</a>
            </div>
          </div>
        </div>
      </div>
      <FooterTaxi />
    </div>
  );
} 