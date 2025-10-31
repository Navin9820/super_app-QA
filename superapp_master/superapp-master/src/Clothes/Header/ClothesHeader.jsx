import React from "react";
import leftarrow from "../../Icons/arrow-left.svg";
import { useNavigate } from "react-router-dom";
import { LocationDisplay } from "../../Grocery/SubPages/Header";

function Header() {
    const navigate = useNavigate();
    return (
        <div className="fixed top-0 left-0 w-full bg-white shadow-md flex flex-row items-center justify-between pt-8 px-4 pb-2 z-50">
            <div className="flex items-center gap-2 min-w-0">
                <img src={leftarrow} alt="arrow" className="w-6 h-6 cursor-pointer flex-shrink-0" onClick={()=> navigate(-1)}/> 
                <h1 className="text-base font-extrabold tracking-wide text-[var(--city-bell-color)] ml-1">City Bell</h1>
            </div>
            <LocationDisplay />
        </div>
    );
}

export default Header;
