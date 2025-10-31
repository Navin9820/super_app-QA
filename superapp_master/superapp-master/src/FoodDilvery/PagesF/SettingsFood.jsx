import React from 'react'
import arrow from "../../Icons/arrow-right.svg";
import { useNavigate } from 'react-router-dom';
import HeaderInsideFood from '../ComponentsF/HeaderInsideFood';
import FooterFood from '../ComponentsF/FooterFood';
import { authService } from '../../services/authService';

function SettingsFood() {
    const navigate = useNavigate();
    
    const handleSignOut = async () => {
        console.log('Food Settings: Signing out user');
        try {
            // Use authService to properly logout (includes backend API call)
            await authService.logout();
            
            // Navigate to login
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            // Even if logout fails, navigate to login
            navigate('/login');
        }
    };
    
    return (
        <div className='bg-[#F8F8F8] min-h-screen'>
            <HeaderInsideFood />
            <div className='px-4 pt-24'>
                <div className='font-medium text-base'>Settings</div>
                <div className='bg-white border border-[#E1E1E1] p-4 rounded-[20px] mt-4'>

                    {/* <div className="flex justify-between items-center px-4 py-3 border-b border-[#CCCCCC]"
                        onClick={() => navigate("/home-food/notification")}
                    >
                        <h2 className="text-sm font-medium">Notification</h2>
                        <img
                            src={arrow}
                            className="w-4 h-4 cursor-pointer transform transition-transform"
                            alt="Toggle view"
                        />
                    </div> */}
                    <div className="flex justify-between items-center px-4 py-3 border-b border-[#CCCCCC]"
                        onClick={() => navigate("/home-food/terms-conditions")}
                    >
                        <h2 className="text-sm font-medium">Terms & Conditions</h2>
                        <img
                            src={arrow}
                            className="w-4 h-4 cursor-pointer transform transition-transform"
                            alt="Toggle view"
                        />
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 border-b border-[#CCCCCC]"
                        onClick={() => navigate("/home-food/privacy")}>
                        <h2 className="text-sm font-medium">Privacy Policy</h2>
                        <img
                            src={arrow}
                            className="w-4 h-4 cursor-pointer transform transition-transform"
                            alt="Toggle view"
                        />
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 border-b border-[#CCCCCC]"
                        onClick={() => navigate("/home-food/about")}>
                        <h2 className="text-sm font-medium">About</h2>
                        <img
                            src={arrow}
                            className="w-4 h-4 cursor-pointer transform transition-transform"
                            alt="Toggle view"
                        />
                    </div>
                    <div className="flex justify-between items-center px-4 py-3"
                        onClick={handleSignOut}>
                        <h2 className="text-sm font-medium">Sign Out</h2>
                        <img
                            src={arrow}
                            className="w-4 h-4 cursor-pointer transform transition-transform"
                            alt="Toggle view"
                        />
                    </div>


                </div>
            </div>
            <FooterFood />
        </div>
    )
}
export default SettingsFood;