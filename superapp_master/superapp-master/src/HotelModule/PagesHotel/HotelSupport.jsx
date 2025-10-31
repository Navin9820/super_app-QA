import React from 'react';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function HotelSupport() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50 p-4">
                <div className="relative flex items-center justify-center max-w-2xl mx-auto px-4">
                    <button onClick={() => navigate(-1)} className="absolute left-0">
                        <ArrowLeft size={24} className="text-gray-700 hover:text-sky-600" />
                    </button>
                    <h1 className="text-sm font-semibold text-sky-600">Support</h1>
                </div>
            </header>
            <div className="pt-20 flex flex-col items-center justify-center h-full">
                <div className="bg-white rounded-2xl shadow-md p-6 mt-6 text-center max-w-md mx-auto">
                    <HelpCircle size={40} className="text-sky-400 mb-3 mx-auto" />
                    <h2 className="text-base font-semibold text-gray-800">Need help with your hotel booking?</h2>
                    <ul className="mt-3 space-y-2 text-sm font-semibold text-gray-600 text-left">
                        <li>• For changes or cancellations, go to My Bookings.</li>
                        <li>• Keep your booking ID handy when contacting support.</li>
                        <li>• Refunds (if applicable) are processed by your payment provider.</li>
                        <li>• Special requests are subject to hotel availability.</li>
                        <li>• Check hotel check-in/out times in your booking details.</li>
                        <li>• A valid government ID is required at check-in.</li>
                        <li>• Early check-in/late check-out may incur additional charges.</li>
                        <li>• Taxes and fees are shown before payment on the payment page.</li>
                        <li>• For invoice/GST requests, use the billing section during payment.</li>
                        <li>• Pets, smoking, and party policies vary by hotel—review hotel rules.</li>
                        <li>• If payment fails but is debited, your bank may take 5–7 days to reverse.</li>
                        <li>• For no‑show cases, hotel policy determines eligibility for refunds.</li>
                    </ul>
                    <p className="text-xs font-semibold text-gray-500 mt-4">For anything else, contact support from within the app.</p>
                </div>
            </div>
        </div>
    );
}

export default HotelSupport;