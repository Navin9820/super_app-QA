import React from 'react'
import arrow from "../../Icons/arrow-right.svg";
import Footer from '../../Utility/Footer';
import ClothesHeader from '../Header/ClothesHeader';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

function Settings() {
    const navigate = useNavigate();
    
    const handleSignOut = async () => {
        console.log('🔍 Settings: Starting sign out process');
        try {
            // Use authService to properly logout (includes backend API call)
            console.log('🔍 Settings: Calling authService.logout()');
            await authService.logout();
            console.log('🔍 Settings: authService.logout() completed');
            
            // Navigate to login
            console.log('🔍 Settings: Navigating to /login');
            navigate('/login');
            console.log('🔍 Settings: Navigation completed');
        } catch (error) {
            console.error('🔍 Settings: Logout error:', error);
            // Even if logout fails, navigate to login
            console.log('🔍 Settings: Navigating to /login after error');
            navigate('/login');
        }
    };
    
    return (
        <div className='bg-[#F8F8F8] min-h-screen'>
            <ClothesHeader />
            <div className='px-4 pt-24'>
                <div className="flex items-center gap-3 mb-4">
                    <div className='font-medium text-base'>Settings</div>
                </div>
                <div className='bg-white border border-[#E1E1E1] p-4 rounded-[20px] mt-4'>
                    {/* <div className="flex justify-between items-center px-4 py-3 border-b border-[#CCCCCC] cursor-pointer hover:cursor-pointer"
                        onClick={() => navigate("/home-clothes/notification")}
                    >
                        <h2 className="text-sm font-medium">Notification</h2>
                        <img
                            src={arrow}
                            className="w-4 h-4 cursor-pointer transform transition-transform hover:cursor-pointer"
                            alt="Toggle view"
                        />
                    </div> */}
                    <div className="flex justify-between items-center px-4 py-3 border-b border-[#CCCCCC] cursor-pointer hover:cursor-pointer"
                        onClick={() => navigate("/home-clothes/terms-conditions")}
                    >
                        <h2 className="text-sm font-medium">Terms & Conditions</h2>
                        <img
                            src={arrow}
                            className="w-4 h-4 cursor-pointer transform transition-transform hover:cursor-pointer"
                            alt="Toggle view"
                        />
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 border-b border-[#CCCCCC] cursor-pointer hover:cursor-pointer"
                        onClick={() => navigate("/home-clothes/privacy-policy")}>
                        <h2 className="text-sm font-medium">Privacy Policy</h2>
                        <img
                            src={arrow}
                            className="w-4 h-4 cursor-pointer transform transition-transform hover:cursor-pointer"
                            alt="Toggle view"
                        />
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 border-b border-[#CCCCCC] cursor-pointer hover:cursor-pointer"
                        onClick={() => navigate("/home-clothes/about")}>
                        <h2 className="text-sm font-medium">About</h2>
                        <img
                            src={arrow}
                            className="w-4 h-4 cursor-pointer transform transition-transform hover:cursor-pointer"
                            alt="Toggle view"
                        />
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 cursor-pointer hover:cursor-pointer"
                        onClick={handleSignOut}>
                        <h2 className="text-sm font-medium">Sign Out</h2>
                        <img
                            src={arrow}
                            className="w-4 h-4 cursor-pointer transform transition-transform hover:cursor-pointer"
                            alt="Toggle view"
                        />
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}
export default Settings;