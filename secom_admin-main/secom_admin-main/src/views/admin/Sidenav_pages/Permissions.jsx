import React, { useState, useEffect, useRef } from 'react';
import { FaEdit, FaTrashAlt, FaPlus, FaEllipsisV, FaEye, FaShieldAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import * as Yup from 'yup';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { FaSpinner } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Removed Navbar import
import UserModuleHeader from 'components/common/UserModuleHeader';
import { TokenExpiration } from 'views/auth/TokenExpiration ';
import { permissionService } from 'services/permissionService';

function Permissions() {
    const [tableData, setTableData] = useState([]);
    const [openAddModal, setOpenAddModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedPermission, setSelectedPermission] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const [moduleFilter, setModuleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const validationSchema = Yup.object({
        name: Yup.string().required('Permission name is required'),
        description: Yup.string().required('Description is required'),
        module: Yup.string().required('Module is required'),
        actions: Yup.array().min(1, 'At least one action must be selected').required('Actions are required')
    });

    const { reset, control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            name: '',
            description: '',
            module: '',
            actions: []
        }
    });

    const watchedActions = watch('actions');

    const fetchPermissionData = async () => {
        try {
            setLoading(true);
            const response = await permissionService.getAllPermissions({
                page: currentPage,
                limit: itemsPerPage
            });
            
            if (response?.success && Array.isArray(response.data)) {
                setTableData(response.data);
                setFilteredData(response.data);
                setTotalItems(response.data.length);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error(error.message || 'Failed to fetch permissions');
            setTableData([]);
            setFilteredData([]);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    useEffect(() => {
        let filtered = tableData;

        if (searchQuery) {
            const lowercasedSearchQuery = searchQuery.toLowerCase();
            filtered = filtered.filter((permission) => {
                return (
                    permission.name?.toLowerCase().includes(lowercasedSearchQuery) ||
                    permission.description?.toLowerCase().includes(lowercasedSearchQuery) ||
                    permission.module?.toLowerCase().includes(lowercasedSearchQuery)
                );
            });
        }

        if (moduleFilter !== 'all') {
            filtered = filtered.filter(permission => permission.module === moduleFilter);
        }

        setFilteredData(filtered);
        setTotalItems(filtered.length);
        setCurrentPage(1);
    }, [searchQuery, moduleFilter, tableData]);

    useEffect(() => {
        fetchPermissionData();
    }, [currentPage, itemsPerPage]);

    const getPaginatedData = () => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return filteredData.slice(start, end);
    };

    function formatDateWithOrdinal(dateString) {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        
        const ordinal = (n) => {
            if (n > 3 && n < 21) return 'th';
            switch (n % 10) {
                case 1: return 'st';
                case 2: return 'nd';
                case 3: return 'rd';
                default: return 'th';
            }
        };
    
        return `${day}${ordinal(day)} ${month} ${year}`;
    }

    const MODULE_MAPPING = {
        users: { resource: 'users', module: 'admin', category: 'all' },
        products: { resource: 'products', module: 'ecommerce', category: 'electronics' },
        orders: { resource: 'orders', module: 'taxi', category: 'taxi' },
        categories: { resource: 'categories', module: 'admin', category: 'all' },
        hotels: { resource: 'products', module: 'hotel', category: 'hotels' },
        restaurants: { resource: 'products', module: 'restaurant', category: 'restaurants' },
        taxi: { resource: 'orders', module: 'taxi', category: 'taxi' },
        grocery: { resource: 'products', module: 'grocery', category: 'groceries' },
        system: { resource: 'users', module: 'admin', category: 'all' }
    };

    const ACTION_MAPPING = {
        view: 'read',
        create: 'create',
        edit: 'update',
        delete: 'delete',
        manage: 'manage'
    };

    const ACTION_REVERSE_MAPPING = {
        read: 'view',
        create: 'create',
        update: 'edit',
        delete: 'delete',
        manage: 'manage'
    };

    const handleFormSubmit = async (data) => {
        try {
            setLoading(true);
            const selectedModule = moduleOptions.find(opt => opt.value === data.module);
            const mapping = MODULE_MAPPING[data.module] || MODULE_MAPPING['users'];
            const actions = data.actions || [];
            let successCount = 0;
            let errorCount = 0;
            for (const action of actions) {
                const backendAction = ACTION_MAPPING[action] || action;
                const permissionData = {
                    name: `${data.name} - ${backendAction}`,
                    description: data.description,
                    resource: mapping.resource,
                    action: backendAction,
                    category: mapping.category,
                    module: mapping.module
                };
                if (openEditModal && selectedPermission) {
                    await permissionService.updatePermission(selectedPermission._id, permissionData);
                    successCount++;
                } else {
                    try {
                        await permissionService.createPermission(permissionData);
                        successCount++;
                    } catch (err) {
                        errorCount++;
                    }
                }
            }
            if (successCount > 0) toast.success(`${successCount} permission(s) saved successfully!`);
            if (errorCount > 0) toast.error(`${errorCount} permission(s) failed to save.`);
            setOpenAddModal(false);
            setOpenEditModal(false);
            setSelectedPermission(null);
            reset();
            fetchPermissionData();
        } catch (error) {
            console.error('Error saving permission:', error);
            toast.error(error.message || 'Failed to save permission');
        } finally {
            setLoading(false);
        }
    };

    const handleEditPermission = (permission) => {
        setSelectedPermission(permission);
        setValue('name', permission.name || '');
        setValue('description', permission.description || '');
        setValue('module', permission.module || permission.resource || '');
        let actions = [];
        if (permission.actions) {
            actions = permission.actions.split(',').map(a => ACTION_REVERSE_MAPPING[a] || a);
        } else if (permission.action) {
            actions = [ACTION_REVERSE_MAPPING[permission.action] || permission.action];
        }
        setValue('actions', actions);
        setOpenEditModal(true);
    };

    const moduleOptions = [
        { value: 'users', label: 'User Management', icon: '👥' },
        { value: 'products', label: 'Product Management', icon: '📦' },
        { value: 'orders', label: 'Order Management', icon: '📋' },
        { value: 'categories', label: 'Category Management', icon: '📂' },
        { value: 'hotels', label: 'Hotel Management', icon: '🏨' },
        { value: 'restaurants', label: 'Restaurant Management', icon: '🍽️' },
        { value: 'taxi', label: 'Taxi Management', icon: '🚕' },
        { value: 'grocery', label: 'Grocery Management', icon: '🛒' },
        { value: 'system', label: 'System Settings', icon: '⚙️' }
    ];

    const actionOptions = [
        { value: 'view', label: 'View', description: 'Can view items' },
        { value: 'create', label: 'Create', description: 'Can create new items' },
        { value: 'edit', label: 'Edit', description: 'Can modify existing items' },
        { value: 'delete', label: 'Delete', description: 'Can remove items' },
        { value: 'manage', label: 'Manage', description: 'Full access to all operations' }
    ];

    const handleActionToggle = (action) => {
        const currentActions = watchedActions || [];
        const newActions = currentActions.includes(action)
            ? currentActions.filter(a => a !== action)
            : [...currentActions, action];
        setValue('actions', newActions);
    };

    const getUniqueModules = () => {
        const modules = tableData.map(permission => permission.module || permission.resource).filter(Boolean);
        return [...new Set(modules)];
    };

    return (
        <div className="min-h-screen">
            <TokenExpiration />
            <ToastContainer />
            
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Permission Management</h1>
                        <p className="text-gray-600 mt-1">Control what users can access and modify in different modules</p>
                    </div>
                    <button
                        onClick={() => {
                            reset();
                            setOpenAddModal(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                    >
                        <FaPlus className="mr-2" />
                        Add Permission
                    </button>
                </div>
                
                <div className="flex gap-4 items-center">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search permissions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            aria-label="Search permissions"
                        />
                    </div>
                    
                    <select
                        value={moduleFilter}
                        onChange={(e) => setModuleFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Filter by module"
                    >
                        <option value="all">All Modules</option>
                        {getUniqueModules().map(module => (
                            <option key={module} value={module}>{module}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                {loading ? (
                    <div className="flex justify-center items-center p-8">
                        <FaSpinner className="animate-spin text-4xl text-blue-500" />
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permission</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {getPaginatedData().length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                        {loading ? 'Loading...' : 'No permissions found'}
                                    </td>
                                </tr>
                            ) : (
                                getPaginatedData().map((permission) => (
                                    <tr key={permission._id || permission.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-gray-900">{permission.name}</div>
                                                <div className="text-sm text-gray-500">{permission.description}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                <FaShieldAlt className="mr-1" />
                                                {permission.module || permission.resource || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {formatDateWithOrdinal(permission.createdAt || permission.created_at)}
                                        </td>
                                         <td className="px-3 py-4 text-sm font-medium flex justify-center items-center">
                                            <div className="relative inline-flex group">
                                                <button
                                                    className="text-gray-600 hover:text-gray-900 focus:outline-none p-2"
                                                    aria-label={`Actions for ${permission.name}`}
                                                >
                                                    <FaEllipsisV />
                                                </button>
                                               <div
                              className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2"
                            >
                                                    <button
                                                        onClick={() => handleEditPermission(permission)}
                                                        className="text-blue-600 hover:text-blue-600"
                                                        aria-label={`Edit ${permission.name}`}
                                                    >
                                                        <FaEdit className="text-blue-600" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="flex justify-between items-center mt-4" role="navigation" aria-label="Pagination">
                <div className="flex items-center">
                    <span className="mr-2">Show</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="border border-gray-300 px-4 py-2 rounded-md"
                        aria-label="Items per page"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                    <span className="ml-2">entries</span>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Previous page"
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Next page"
                    >
                        Next
                    </button>
                </div>
            </div>

            {(openAddModal || openEditModal) && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-50" onClick={() => {
                    setOpenAddModal(false);
                    setOpenEditModal(false);
                    setSelectedPermission(null);
                    reset();
                }}>
                    <div className="bg-white rounded-lg shadow-2xl p-8 w-[90%] max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                            {openEditModal ? 'Edit Permission' : 'Add New Permission'}
                        </h2>
                        
                        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Permission Name <span className="text-red-500">*</span>
                                    </label>
                                    <Controller
                                        name="name"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="e.g., Manage Products"
                                                {...field}
                                            />
                                        )}
                                    />
                                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description <span className="text-red-500">*</span>
                                    </label>
                                    <Controller
                                        name="description"
                                        control={control}
                                        render={({ field }) => (
                                            <textarea
                                                rows={3}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Describe what this permission allows users to do..."
                                                {...field}
                                            />
                                        )}
                                    />
                                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Module <span className="text-red-500">*</span>
                                    </label>
                                    <Controller
                                        name="module"
                                        control={control}
                                        render={({ field }) => (
                                            <select
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                {...field}
                                            >
                                                <option value="">Select Module</option>
                                                {moduleOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.icon} {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    />
                                    {errors.module && <p className="text-red-500 text-sm mt-1">{errors.module.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Allowed Actions <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {actionOptions.map(option => (
                                            <label key={option.value} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    checked={watchedActions?.includes(option.value) || false}
                                                    onChange={() => handleActionToggle(option.value)}
                                                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <div>
                                                    <div className="font-medium text-gray-900">{option.label}</div>
                                                    <div className="text-sm text-gray-500">{option.description}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    {errors.actions && <p className="text-red-500 text-sm mt-1">{errors.actions.message}</p>}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 pt-6 border-t">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpenAddModal(false);
                                        setOpenEditModal(false);
                                        setSelectedPermission(null);
                                        reset();
                                    }}
                                    className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                                >
                                    {loading ? (
                                        <FaSpinner className="animate-spin mr-2" />
                                    ) : (
                                        <FaPlus className="mr-2" />
                                    )}
                                    {openEditModal ? 'Update Permission' : 'Create Permission'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Permissions;