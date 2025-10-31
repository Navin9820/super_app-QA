import React from 'react';
import { useState, useEffect } from 'react';
import profilepic from '../../Clothes/Images/profilepic.svg';
import plus from "../../Icons/plus.svg";
import { useNavigate } from 'react-router-dom';
import HeaderInsideFood from '../ComponentsF/HeaderInsideFood';
import FooterFood from '../ComponentsF/FooterFood';
import { profileService } from '../../services/profileService';

function CustomerProfileFood() {
    const navigate = useNavigate();
    const [selected, setSelected] = useState("Home");
    const buttons = ["Home", "Office", "Others"];
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    const [avatar, setAvatar] = useState('');

    useEffect(() => {
        const unified = profileService.getProfile();
        setFullName(unified.fullName || '');
        setPhone(unified.phone || '');
        setEmail(unified.email || '');
        setCity(unified.city || '');
        setState(unified.state || '');
        setPincode(unified.pincode || '');
        setAvatar(unified.profileImage || '');
    }, []);
    return (
        <div className='bg-[#F8F8F8] min-h-screen'>
            <HeaderInsideFood />
            <div className='pt-20 pb-28 px-4'>
                <div className='font-medium text-base pt-4'>Your Profile</div>
                <div className="mt-2 bg-white rounded-full p-2 border border-[#E1E1E1] flex items-center gap-3">

                    <div className="relative w-[50px] h-[50px]">
                        {avatar ? (
                            <img src={avatar} alt="Profile" className="rounded-full w-full h-full object-cover" />
                        ) : (
                            <div className="rounded-full w-full h-full bg-gray-200 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        )}
                        <img
                            src={plus}
                            alt="Plus"
                            className="absolute bottom-0 right-0 w-4 h-4 rounded-full p-0.5"
                            style={{ height: '18px', width: '18px' }}
                        />
                    </div>
                    <div>
                        <div className='text-xs font-medium'>Your Account</div>
                        <div className='text-base font-semibold'>{fullName || 'Add your name'}</div>
                    </div>
                </div>
                <label className="mt-4 block text-sm text-gray-600 w-full">Full name</label>
                <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-white w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1"
                />

                <label className="mt-4 block text-sm text-gray-600 w-full">Phone number</label>
                <input
                    type="number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-white w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1"
                />

                <label className="mt-4 block text-sm text-gray-600 w-full">Email ID</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1"
                />

                <div className="flex gap-x-4 mt-4">
                    <div className="w-1/2">
                        <label className="block text-sm text-gray-600">City*</label>
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="bg-white w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1"
                        />
                    </div>
                    <div className="w-1/2">
                        <label className="block text-sm text-gray-600">State</label>
                        <input
                            type="text"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="bg-white w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1"
                        />
                    </div>
                </div>
                <label className="mt-4 block text-sm text-gray-600 w-full">Pincode*</label>
                <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="bg-white w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5C3FFF] mt-1"
                />
                {/* <div className='font-medium text-base  pt-4'>Select Type</div>
                <div className="flex space-x-2  pt-2">
                    {buttons.map((btn) => (
                        <button
                            key={btn}
                            onClick={() => setSelected(btn)}
                            className={`px-4 py-1 rounded-full border ${selected === btn
                                ? "bg-[#5C3FFF] text-white"
                                : "bg-white text-black border-gray-300"
                                }`}
                        >
                            {btn}
                        </button>
                    ))}
                </div> */}
                <button
                    onClick={() => {
                        profileService.saveProfile({ fullName, phone, email, city, state, pincode, profileImage: avatar });
                        navigate('/home-food/account');
                    }}
                    className="w-full px-4 py-2 bg-[#5C3FFF] text-white rounded-[50px] mt-6" >
                    Submit
                </button>
            </div>
            <FooterFood />
        </div>
    );
}

export default CustomerProfileFood;
