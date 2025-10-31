import React from 'react';
import HeaderInsideTaxi from '../ComponentsTaxi/HeaderInsideTaxi';

export default function Safety() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      <HeaderInsideTaxi />
      <div className="pt-20 pb-8 px-2 w-full flex justify-center items-start">
        <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl p-4 sm:p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-blue-700 text-center">Safety & Emergency</h1>
          
          {/* Safety Overview Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-red-50 p-3 rounded-lg text-center border border-red-200">
              <div className="text-2xl mb-1">🚨</div>
              <div className="text-sm font-medium text-red-800">Emergency SOS</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-200">
              <div className="text-2xl mb-1">📍</div>
              <div className="text-sm font-medium text-blue-800">Share Location</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center border border-green-200">
              <div className="text-2xl mb-1">✅</div>
              <div className="text-sm font-medium text-green-800">Verified Drivers</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg text-center border border-orange-200">
              <div className="text-2xl mb-1">🛡️</div>
              <div className="text-sm font-medium text-orange-800">Safety Tips</div>
            </div>
          </div>

          {/* Emergency Features */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-red-600">🚨 Emergency Features</h2>
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center mb-2">
                  <div className="text-red-600 font-bold text-lg mr-2">SOS</div>
                  <div className="font-semibold text-red-800">Emergency Button</div>
                </div>
                <div className="text-sm text-red-700">Tap the red SOS button in the app to immediately alert local authorities and our emergency response team. Your location will be shared automatically.</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center mb-2">
                  <div className="text-orange-600 font-bold text-lg mr-2">📞</div>
                  <div className="font-semibold text-orange-800">Emergency Helpline</div>
                </div>
                <div className="text-sm text-orange-700">Call our 24/7 emergency helpline at <strong>1800-123-4567</strong> for immediate assistance during any safety concern.</div>
              </div>
            </div>
          </div>

          {/* Safety Features */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-blue-600">🛡️ Safety Features</h2>
            <ul className="space-y-4">
              <li>
                <strong className="text-gray-800">Share your ride:</strong> 
                <div className="text-gray-600 mt-1">Use the 'Share Ride' feature to send live location updates to friends or family. They can track your journey in real-time and receive notifications when you reach your destination.</div>
              </li>
              <li>
                <strong className="text-gray-800">Driver verification:</strong> 
                <div className="text-gray-600 mt-1">All drivers undergo comprehensive background checks, vehicle inspections, and identity verification. Driver photos and vehicle details are verified before each ride.</div>
              </li>
              <li>
                <strong className="text-gray-800">Real-time tracking:</strong> 
                <div className="text-gray-600 mt-1">Your ride is tracked in real-time with GPS. Our system monitors route deviations and can detect unusual patterns or stops.</div>
              </li>
              <li>
                <strong className="text-gray-800">In-app emergency contacts:</strong> 
                <div className="text-gray-600 mt-1">Add emergency contacts in your profile. They'll be automatically notified in case of any safety issues during your ride.</div>
              </li>
            </ul>
          </div>
          {/* Safety Tips */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-orange-600">🛡️ Safety Tips</h2>
            <div className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="font-semibold text-orange-800 mb-2">Before Your Ride</div>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Always verify driver photo and vehicle details</li>
                  <li>• Check the vehicle number matches the app</li>
                  <li>• Share your ride details with a trusted contact</li>
                  <li>• Wait in a well-lit, public area for pickup</li>
                </ul>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="font-semibold text-blue-800 mb-2">During Your Ride</div>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Always wear your seatbelt</li>
                  <li>• Avoid sharing personal information with the driver</li>
                  <li>• Keep your phone charged and accessible</li>
                  <li>• Trust your instincts - if something feels wrong, end the ride</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="font-semibold text-green-800 mb-2">After Your Ride</div>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Rate your driver and provide feedback</li>
                  <li>• Check that you have all your belongings</li>
                  <li>• Report any safety concerns immediately</li>
                  <li>• Confirm you've reached your destination safely</li>
          </ul>
              </div>
            </div>
          </div>

          {/* Emergency Procedures */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-red-600">🚨 Emergency Procedures</h2>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-sm text-red-800 space-y-2">
                <div className="font-semibold">If you feel unsafe or in danger:</div>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Tap the SOS button in the app immediately</li>
                  <li>Call local authorities at <span className="font-bold">112</span> or <span className="font-bold">100</span></li>
                  <li>Call our emergency helpline: <span className="font-bold">1800-123-4567</span></li>
                  <li>Share your ride details with trusted contacts</li>
                  <li>Move to a safe, public location if possible</li>
                  <li>Take photos/videos if safe to do so</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Driver Verification */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-green-600">✅ Driver Verification</h2>
            <div className="space-y-3">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="text-sm text-green-800">
                  <strong>Before boarding, always verify:</strong>
                </div>
                <ul className="text-sm text-green-700 mt-2 space-y-1">
                  <li>• Driver's photo matches the person</li>
                  <li>• Vehicle number matches the app</li>
                  <li>• Vehicle color and model match</li>
                  <li>• Driver knows your name and destination</li>
                </ul>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <div className="text-sm text-yellow-800">
                  <strong>⚠️ Do NOT board if:</strong>
                </div>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  <li>• Driver details don't match the app</li>
                  <li>• Vehicle doesn't match the description</li>
                  <li>• Driver asks you to cancel and pay cash</li>
                  <li>• You feel uncomfortable for any reason</li>
            </ul>
          </div>
            </div>
          </div>

          {/* Women's Safety */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-pink-600">👩 Women's Safety</h2>
            <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
              <div className="text-sm text-pink-800 space-y-2">
                <div className="font-semibold">Special safety features for women:</div>
                <ul className="space-y-1">
                  <li>• Women drivers available on request</li>
                  <li>• Free rides for women (10 PM - 6 AM)</li>
                  <li>• Priority emergency response</li>
                  <li>• Dedicated women's safety helpline</li>
                  <li>• Enhanced background checks for women drivers</li>
            </ul>
          </div>
            </div>
          </div>

          {/* Important Safety Information */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-3 text-gray-600">📋 Important Safety Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-800 space-y-2">
                <div className="font-semibold">Remember these key safety points:</div>
                <ul className="space-y-1">
                  <li>• Always verify your driver and vehicle before boarding</li>
                  <li>• Share your ride details with trusted contacts</li>
                  <li>• Keep your phone charged and accessible during rides</li>
                  <li>• Trust your instincts - if something feels wrong, end the ride</li>
                  <li>• Use the SOS button or call emergency numbers if needed</li>
                  <li>• Report any safety concerns immediately</li>
                </ul>
                <div className="mt-3 text-xs text-gray-600">
                  All safety reports are taken seriously and investigated promptly by our dedicated safety team.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 