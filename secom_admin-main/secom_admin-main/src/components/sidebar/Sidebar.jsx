import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { HiX } from "react-icons/hi";
import { FiMenu } from "react-icons/fi";

const Sidebar = ({ isCollapsed, open, onClose, onSidenavToggle, routes }) => {
  const location = useLocation();
  const [dropdowns, setDropdowns] = useState({});

  // Filter out authentication routes from the passed `routes` prop
  const sidebarRoutes = routes.filter(route => route.layout === '/admin');

  const toggleDropdown = (key) => {
    setDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity xl:hidden ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      ></div>

      <div
        className={`fixed z-30 flex h-screen flex-col bg-white font-bold transition-all duration-300 ease-in-out
          ${isCollapsed ? "w-20" : "w-64"}
          ${open ? "translate-x-0" : "-translate-x-full"}
          xl:translate-x-0`}
      >
        {/* Sidebar Toggle - always visible, vertically centered with icons */}
        <div className="flex items-center justify-between p-4">
          <span className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 delay-0' : 'opacity-100 delay-200'}`}>Admin Panel</span>
          <span
            className="flex cursor-pointer text-xl text-gray-600 dark:text-white"
            onClick={onSidenavToggle}
            aria-label="Toggle sidebar"
            tabIndex={0}
          >
            <FiMenu className="h-5 w-5" />
          </span>
        </div>
        {/* Mobile Close Button */}
        <span
          className="absolute top-4 right-4 block cursor-pointer xl:hidden"
          onClick={onClose}
        >
          <HiX />
        </span>
        <nav className="flex-grow overflow-y-auto overflow-x-hidden pr-2">
          {sidebarRoutes.map((item, index) => (
            <div key={index}>
              {item.subNav ? (
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer text-black hover:text-[#4318ff]" 
                  onClick={() => !isCollapsed && toggleDropdown(index)}
                >
                  <div className="flex items-center">
                    {item.icon}
                    <span className={`ml-2 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>{item.name}</span>
                  </div>
                  {!isCollapsed && (dropdowns[index] ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />)}
                </div>
              ) : (
                <Link 
                  to={`/admin/${item.path}`} 
                  className={`flex items-center p-3 text-black ${location.pathname === `/admin/${item.path}` ? "text-[#4318ff] font-bold" : "hover:text-[#4318ff]"}`}
                >
                  {item.icon}
                  <span className={`ml-2 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>{item.name}</span>
                </Link>
              )}
              {/* Dropdown should not be visible when collapsed */}
              {!isCollapsed && dropdowns[index] && item.subNav && (
                <div className="ml-4">
                  {item.subNav.map((subItem, subIndex) => (
                    <div key={subIndex}>
                      <Link 
                        to={`/admin/${subItem.path}`} 
                        className={`ml-4 flex items-center text-gray-600 p-2 ${location.pathname === `/admin/${subItem.path}` ? "text-[#4318ff] font-bold" : "hover:text-[#4318ff]"}`}
                      >
                        {subItem.icon}
                        <span className="ml-2 whitespace-nowrap">{subItem.name}</span>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar; 