import React from 'react';
import { FaPlus, FaSpinner } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';

const UserModuleHeader = ({
  title,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  statusFilter = "all",
  onStatusFilterChange,
  showStatusFilter = true,
  onAddClick,
  addButtonText = "Add New",
  loading = false,
  children // For additional custom elements
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      
      <div className="flex gap-2 items-center">
        {/* Search Bar */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[250px]"
          />
        </div>

        {/* Status Filter */}
        {showStatusFilter && (
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        )}

        {/* Custom Elements */}
        {children}

        {/* Add Button */}
        <button
          onClick={onAddClick}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <FaSpinner className="animate-spin mr-2" />
          ) : (
            <FaPlus className="mr-2" />
          )}
          {addButtonText}
        </button>
      </div>
    </div>
  );
};

export default UserModuleHeader; 