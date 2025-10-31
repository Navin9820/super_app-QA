import React from 'react';
import HeaderInsideTaxi from '../ComponentsTaxi/HeaderInsideTaxi';
import FooterTaxi from "../ComponentsTaxi/FooterTaxi";

export default function Rewards() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      <HeaderInsideTaxi />
      <div className="pt-20 pb-8 px-2 w-full flex justify-center items-start">
        <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl p-4 sm:p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-blue-700 text-center">My Rewards</h1>
          
          {/* Rewards Overview */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-200">
              <div className="text-lg font-bold text-blue-800">₹1,250</div>
              <div className="text-xs text-blue-600">Total Earned</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center border border-yellow-200">
              <div className="text-lg font-bold text-yellow-800">Gold</div>
              <div className="text-xs text-yellow-600">Member Tier</div>
            </div>
          </div>

          {/* Active Rewards */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-green-600">🎁 Active Rewards</h2>
            <div className="space-y-3">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-green-800">5% Cashback</div>
                    <div className="text-sm text-green-600">On all rides this month</div>
                  </div>
                  <div className="text-green-600 font-bold">₹25</div>
                </div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-yellow-800">Free Ride Coupon</div>
                    <div className="text-sm text-yellow-600">Valid until Dec 31, 2024</div>
                  </div>
                  <div className="text-yellow-600 font-bold">FREERIDE</div>
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-blue-800">Priority Support</div>
                    <div className="text-sm text-blue-600">Gold member benefit</div>
                  </div>
                  <div className="text-blue-600 font-bold">Active</div>
                </div>
              </div>
            </div>
          </div>

          {/* Reward History */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-blue-600">📊 Reward History</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">💰</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Ride Cashback</div>
                    <div className="text-xs text-gray-500">Dec 15, 2024</div>
                  </div>
                </div>
                <div className="text-green-600 font-semibold">+₹25</div>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">🎁</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Referral Bonus</div>
                    <div className="text-xs text-gray-500">Dec 12, 2024</div>
                  </div>
                </div>
                <div className="text-green-600 font-semibold">+₹50</div>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-sm">⭐</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Loyalty Points</div>
                    <div className="text-xs text-gray-500">Dec 10, 2024</div>
                  </div>
                </div>
                <div className="text-green-600 font-semibold">+₹15</div>
              </div>
            </div>
          </div>
          {/* How to Earn More */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-blue-600">🚀 How to Earn More Rewards</h2>
            <div className="space-y-3">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="text-blue-600 text-lg">🚗</div>
                  <div>
                    <div className="font-medium text-blue-800">Take More Rides</div>
                    <div className="text-sm text-blue-600">Earn 1 point per ₹10 spent on rides</div>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="text-green-600 text-lg">👥</div>
                  <div>
                    <div className="font-medium text-green-800">Refer Friends</div>
                    <div className="text-sm text-green-600">Get ₹50 for each successful referral</div>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-3">
                  <div className="text-purple-600 text-lg">🎯</div>
                  <div>
                    <div className="font-medium text-purple-800">Complete Challenges</div>
                    <div className="text-sm text-purple-600">Weekly and monthly ride challenges</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reward Tiers */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-blue-600">🏆 Reward Tiers</h2>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-400 text-lg">🥉</div>
                    <div>
                      <div className="font-medium text-gray-800">Silver</div>
                      <div className="text-sm text-gray-600">0-10 rides/month</div>
                    </div>
                  </div>
                  <div className="text-gray-600 text-sm">2% cashback</div>
                </div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-yellow-500 text-lg">🥈</div>
                    <div>
                      <div className="font-medium text-yellow-800">Gold (Current)</div>
                      <div className="text-sm text-yellow-600">11-30 rides/month</div>
                    </div>
                  </div>
                  <div className="text-yellow-600 text-sm font-medium">5% cashback</div>
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-purple-500 text-lg">🥇</div>
                    <div>
                      <div className="font-medium text-purple-800">Platinum</div>
                      <div className="text-sm text-purple-600">31+ rides/month</div>
                    </div>
                  </div>
                  <div className="text-purple-600 text-sm">10% cashback</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button className="w-full px-6 py-3 bg-yellow-400 text-black rounded font-semibold shadow hover:bg-yellow-300 transition">Redeem Rewards</button>
            <button className="w-full px-6 py-3 bg-blue-600 text-white rounded font-semibold shadow hover:bg-blue-500 transition">View All Offers</button>
          </div>
        </div>
      </div>
      <FooterTaxi />
    </div>
  );
} 