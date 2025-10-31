import React, { useState } from 'react';
import HomeHeaderTaxi from '../ComponentsTaxi/HomeHeaderTaxi';
import FooterTaxi from "../ComponentsTaxi/FooterTaxi";

export default function Coins() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="bg-gradient-to-b from-blue-100 to-green-100 min-h-screen">
      <HomeHeaderTaxi showBack={true} />
      <div className="pt-20 flex justify-center items-start">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mt-4 border border-blue-200">
          <h1 className="text-2xl font-bold mb-4 text-center text-blue-700">Taxi Coins</h1>
          
          {/* Coins Balance */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 mb-6 border border-yellow-200">
            <div className="text-center">
              <div className="text-3xl mb-2">🪙</div>
              <div className="text-2xl font-bold text-yellow-800 mb-1">1,200</div>
              <div className="text-sm text-yellow-600">Taxi Coins</div>
              <div className="text-xs text-gray-500 mt-1">Equivalent to ₹12</div>
            </div>
          </div>

          {/* Coins Value */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">💰 Coins Value</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                <div className="text-lg font-bold text-green-800">100</div>
                <div className="text-xs text-green-600">Coins = ₹1</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                <div className="text-lg font-bold text-blue-800">1,000</div>
                <div className="text-xs text-blue-600">Coins = ₹10</div>
              </div>
            </div>
          </div>

          {/* How to Earn Coins */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">🚀 How to Earn Coins</h3>
            <div className="space-y-3">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-blue-800">Take Rides</div>
                    <div className="text-sm text-blue-600">Earn 10 coins per ₹100 spent</div>
                  </div>
                  <div className="text-blue-600 font-bold">🚗</div>
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-green-800">Refer Friends</div>
                    <div className="text-sm text-green-600">Get 500 coins per referral</div>
                  </div>
                  <div className="text-green-600 font-bold">👥</div>
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-purple-800">Daily Check-in</div>
                    <div className="text-sm text-purple-600">Get 50 coins daily</div>
                  </div>
                  <div className="text-purple-600 font-bold">📅</div>
                </div>
              </div>
            </div>
          </div>
          {/* Redemption Options */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">🎁 Redemption Options</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">Ride Discount</div>
                  <div className="text-sm text-gray-600">100 coins = ₹1 off</div>
                </div>
                <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded">Redeem</button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">Free Ride</div>
                  <div className="text-sm text-gray-600">500 coins = ₹5 off</div>
                </div>
                <button className="px-3 py-1 bg-green-600 text-white text-xs rounded">Redeem</button>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">📊 Recent Transactions</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-xs">+</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">Ride Completed</div>
                    <div className="text-xs text-gray-500">Dec 15, 2024</div>
                  </div>
                </div>
                <div className="text-green-600 font-semibold text-sm">+50</div>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-xs">-</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">Redeemed for Ride</div>
                    <div className="text-xs text-gray-500">Dec 12, 2024</div>
                  </div>
                </div>
                <div className="text-red-600 font-semibold text-sm">-100</div>
              </div>
            </div>
          </div>

          <button
            className="w-full mt-4 px-4 py-3 bg-blue-600 hover:bg-green-600 text-white rounded font-semibold transition"
            onClick={() => setShowModal(true)}
          >
            Redeem Coins
          </button>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-xs">
            <h2 className="text-lg font-bold mb-2 text-green-700">Redemption Successful!</h2>
            <p className="mb-4 text-gray-700">Your Taxi Coins have been redeemed for discounts on your next ride.</p>
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-green-600 text-white rounded font-semibold transition"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      <FooterTaxi />
    </div>
  );
} 