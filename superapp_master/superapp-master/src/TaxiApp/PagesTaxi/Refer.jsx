import React from 'react';
import HeaderInsideTaxi from '../ComponentsTaxi/HeaderInsideTaxi';
import FooterTaxi from "../ComponentsTaxi/FooterTaxi";

export default function Refer() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      <HeaderInsideTaxi />
      <div className="pt-20 pb-8 px-2 w-full flex justify-center items-start">
        <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl p-4 sm:p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-blue-700 text-center">Refer & Earn</h1>
          
          {/* Referral Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-200">
              <div className="text-lg font-bold text-blue-800">12</div>
              <div className="text-xs text-blue-600">Total Referrals</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center border border-green-200">
              <div className="text-lg font-bold text-green-800">₹600</div>
              <div className="text-xs text-green-600">Total Earned</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center border border-yellow-200">
              <div className="text-lg font-bold text-yellow-800">₹50</div>
              <div className="text-xs text-yellow-600">Per Referral</div>
            </div>
          </div>

          <div className="mb-4 text-center">Invite your friends and earn <span className="font-bold text-yellow-600">₹50</span> for each successful referral!</div>
          
          {/* Referral Code Section */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 mb-6 border border-yellow-200">
            <div className="text-center mb-4">
              <div className="text-sm text-gray-600 mb-1">Your Unique Referral Code</div>
              <div className="font-mono text-xl font-bold text-blue-800 bg-white px-4 py-2 rounded border-2 border-dashed border-blue-300">RAPIDO50</div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 bg-yellow-400 rounded text-black font-semibold shadow hover:bg-yellow-300 transition">Copy Code</button>
              <button className="flex-1 px-4 py-2 bg-green-500 text-white rounded font-semibold shadow hover:bg-green-400 transition">Share WhatsApp</button>
            </div>
          </div>

          {/* Quick Share Options */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Quick Share Options</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition">
                <div className="text-blue-600 font-medium text-sm">📱 SMS</div>
              </button>
              <button className="p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition">
                <div className="text-green-600 font-medium text-sm">📧 Email</div>
              </button>
              <button className="p-3 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition">
                <div className="text-purple-600 font-medium text-sm">📱 Social Media</div>
              </button>
              <button className="p-3 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition">
                <div className="text-orange-600 font-medium text-sm">📋 Copy Link</div>
              </button>
            </div>
          </div>
          {/* How It Works */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-blue-600">🎯 How It Works</h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">Share Your Code</div>
                  <div className="text-sm text-gray-600">Share your unique referral code with friends via WhatsApp, SMS, or social media</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">Friend Signs Up</div>
                  <div className="text-sm text-gray-600">Your friend downloads the app and uses your referral code during registration</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">First Ride Complete</div>
                  <div className="text-sm text-gray-600">Your friend completes their first ride with a minimum fare of ₹100</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">✓</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">Earn Rewards</div>
                  <div className="text-sm text-gray-600">You both get ₹50 credited to your wallet instantly!</div>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Benefits */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-green-600">🎁 Referral Benefits</h2>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-green-800">For You</div>
                    <div className="text-sm text-green-600">₹50 per successful referral</div>
                  </div>
                  <div className="text-green-600 font-bold">💰</div>
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-blue-800">For Your Friend</div>
                    <div className="text-sm text-blue-600">₹50 welcome bonus + 20% off first ride</div>
                  </div>
                  <div className="text-blue-600 font-bold">🎉</div>
                </div>
              </div>
            </div>
          </div>

          {/* Your Referrals */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-blue-600">👥 Your Referrals</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">A</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Arun Kumar</div>
                    <div className="text-xs text-gray-500">Completed 1st ride</div>
                  </div>
                </div>
                <div className="text-green-600 font-semibold">₹50 earned</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 font-bold text-sm">P</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Priya S</div>
                    <div className="text-xs text-gray-500">Signed up, no ride yet</div>
                  </div>
                </div>
                <div className="text-yellow-600 font-semibold">Pending</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">R</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Rahul Dev</div>
                    <div className="text-xs text-gray-500">Completed 3 rides</div>
                  </div>
                </div>
                <div className="text-green-600 font-semibold">₹50 earned</div>
              </div>
            </div>
          </div>

          {/* Referral Milestones */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-purple-600">🏆 Referral Milestones</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <div className="text-gray-400">🥉</div>
                  <div className="text-sm">5 Referrals</div>
                </div>
                <div className="text-xs text-gray-500">Bonus ₹100</div>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <div className="text-gray-400">🥈</div>
                  <div className="text-sm">10 Referrals</div>
                </div>
                <div className="text-xs text-gray-500">Bonus ₹250</div>
              </div>
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
                <div className="flex items-center space-x-2">
                  <div className="text-yellow-500">🥇</div>
                  <div className="text-sm font-medium">20 Referrals</div>
                </div>
                <div className="text-xs text-yellow-600 font-medium">Bonus ₹500</div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="text-center mt-6 space-y-2">
            <a href="#" className="text-blue-600 underline text-sm block">Referral Terms & Conditions</a>
            <div className="text-xs text-gray-500">
              Rewards credited within 24 hours of first ride completion
          </div>
          </div>
        </div>
      </div>
      <FooterTaxi />
    </div>
  );
} 