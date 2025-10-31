import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaEdit, FaTrashAlt, FaPlus, FaEllipsisV } from 'react-icons/fa';
import * as Yup from 'yup';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { FaSpinner } from 'react-icons/fa';
import { ToastContainer } from 'react-toastify';
import UserModuleHeader from 'components/common/UserModuleHeader';

function Role() {
    const [tableData, setTableData] = useState([]);
    const [openAddModal, setOpenAddModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedSize, setSelectedSize] = useState(null);
    const [brandImage, setBrandImage] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [rowIdToDelete, setRowIdToDelete] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [totalItems, setTotalItems] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredData, setFilteredData] = useState([]);

    // Yup validation schema
    const validationSchemaAdd = Yup.object({
        name: Yup.string().required('Role Name is required'),
    });

    const validationSchemaEdit = Yup.object({
        name: Yup.string().required('Role Name is required'),
    });

    const { reset, control, handleSubmit, setValue, trigger, formState: { errors } } = useForm({
        resolver: yupResolver(openAddModal ? validationSchemaAdd : validationSchemaEdit),
        defaultValues: {
            size_name: selectedSize?.size_name || '',
        },
    });

    const fetchSizeData = async () => {
        try {
            const response = await axios.get('https://yrpitsolutions.com/ecom_backend/api/get_role');
            
            if (response.status === 200) {
                console.log('Full Response:', response);
                let data = response?.data;
                
                if (Array.isArray(data)) {
                    if (searchQuery.trim() !== '') {
                        data = data.filter((role) =>
                            role.name.toLowerCase().includes(searchQuery.toLowerCase())
                        );
                    }
                    
                    setFilteredData(data);
                    setTotalItems(data.length);
                    
                    const totalPages = Math.ceil(data.length / itemsPerPage);
                    if (currentPage > totalPages) {
                        setCurrentPage(totalPages);
                    }
                } else {
                    console.error('Expected data to be an array, but got:', data);
                }
            } else {
                console.error('API error: Received unexpected status code', response.status);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchSizeData();
    }, [itemsPerPage, currentPage, searchQuery]);

    const getPaginatedData = () => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return filteredData.slice(start, end);
    };
    
    const handlePageChange = (page) => {
        const totalPages = Math.ceil(totalItems / itemsPerPage); 
        if (page < 1 || page > totalPages) return; 
        setCurrentPage(page); 
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const handleFormSubmit = async (data) => {
        const formData = new FormData();
        formData.append('name', data.name);
        setLoading(true);

        try {
            const accessToken = localStorage.getItem('OnlineShop-accessToken');
            const url = 'https://yrpitsolutions.com/ecom_backend/api/save_roles';

            setTimeout(async () => {
                try {
                    const response = await axios.post(url, formData, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    });

                    if (response.status === 200) {
                        fetchSizeData();
                        setOpenAddModal(false);
                        setBrandImage(null);
                        reset();
                    }
                } catch (error) {
                    console.error('Error submitting form:', error);
                } finally {
                    setLoading(false);
                }
            }, 2000);
        } catch (error) {
            setLoading(false);
            console.error('Error preparing form data:', error);
        }
    };

    const handleFormUpdate = async (data) => {
        setLoading(true);

        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', data.name || selectedSize.name);

        try {
            const accessToken = localStorage.getItem('OnlineShop-accessToken');
            const url = `https://yrpitsolutions.com/ecom_backend/api/update_role_by_id/${selectedSize.id}`;

            setTimeout(async () => {
                try {
                    const response = await axios.post(url, formData, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    });

                    if (response.status === 200) {
                        fetchSizeData();
                        setOpenEditModal(false);
                        setBrandImage(null);
                        reset();
                    }
                } catch (error) {
                    console.error('Error updating form:', error);
                } finally {
                    setLoading(false);
                }
            }, 2000);
        } catch (error) {
            setLoading(false);
            console.error('Error preparing form data:', error);
        }
    };

    const handleAddBrand = () => {
        setSelectedSize(null);
        setValue('name', '');
        setOpenAddModal(true);
    };

    const handleEditRow = (role) => {
        setSelectedSize(role);
        setValue('name', role.name);
        setOpenEditModal(true);
        trigger();
    };

    const handleDeleteRow = (id) => {
        setRowIdToDelete(id);
        setOpenDeleteDialog(true);
    };

    const handleDeleteConfirmation = async () => {
        setIsDeleting(true);
        try {
            const accessToken = localStorage.getItem('OnlineShop-accessToken');
            await axios.delete(`https://yrpitsolutions.com/ecom_backend/api/delete_role_by_id/${rowIdToDelete}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            fetchSizeData();
            setOpenDeleteDialog(false);
        } catch (error) {
            console.error('Error deleting size:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancelDelete = () => {
        setOpenDeleteDialog(false);
    };

    const handleBulkDelete = async () => {
        setLoading(true);
        try {
            const accessToken = localStorage.getItem('OnlineShop-accessToken');
            for (let id of selectedRows) {
                await axios.delete(`https://yrpitsolutions.com/ecom_backend/api/delete_role_by_id/${id}`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
            }
            await fetchSizeData();
            setSelectedRows([]);
        } catch (error) {
            console.error('Error deleting selected sizes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRowSelection = (id) => {
        setSelectedRows((prevSelectedRows) =>
            prevSelectedRows.includes(id)
                ? prevSelectedRows.filter((rowId) => rowId !== id)
                : [...prevSelectedRows, id]
        );
    };

    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="min-h-screen pt-6">
            <ToastContainer />
            <UserModuleHeader
                title="Role Management"
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search by Role Name..."
                showStatusFilter={false}
                onAddClick={handleAddBrand}
                addButtonText="Add Role"
                loading={loading}
            />

            {openAddModal && !openEditModal && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-50"
                    onClick={() => setOpenAddModal(false)}
                >
                    <div
                        className="bg-white rounded-lg shadow-2xl p-12 w-[35%] max-h-[80%] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Add Role</h2>
                        <div className="mb-6">
                            <label className="block text-lg text-gray-600 font-medium mb-2">Role<span className="text-red-500 ">*</span></label>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        type="text"
                                        placeholder="Enter Role"
                                        className="w-full border border-gray-300 rounded-md px-4 py-3 text-gray-800 focus:outline-none"
                                        {...field}
                                    />
                                )}
                            />
                            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                        </div>
                        <div className="flex justify-end space-x-4 mt-4">
                            <button
                                onClick={() => setOpenAddModal(false)}
                                className="bg-gray-300 text-gray-800 px-6 py-3 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit(handleFormSubmit)}
                                disabled={loading}
                                className="relative bg-[#4318ff] text-white px-6 py-3 rounded-lg flex items-center ml-auto max-w-xs"
                            >
                                {loading ? (
                                    <div className="absolute inset-0 flex items-center justify-center w-full h-full">
                                        <div className="w-6 h-6 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    'Save'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {openEditModal && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-50"
                    onClick={() => setOpenEditModal(false)}
                >
                    <div
                        className="bg-white rounded-lg shadow-2xl p-12 w-[35%] max-h-[80%] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Edit Role</h2>
                        <div className="mb-6">
                            <label className="block text-lg text-gray-600 font-medium mb-2">Role Name<span className="text-red-500 ">*</span></label>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        type="text"
                                        placeholder="Enter Role"
                                        className="w-full border border-gray-300 rounded-md px-4 py-3 text-gray-800 focus:outline-none"
                                        {...field}
                                    />
                                )}
                            />
                            {errors.name && (
                                <p className="text-red-500 text-sm">{errors.name.message}</p>
                            )}
                        </div>
                        <div className="flex justify-end space-x-4 mt-4">
                            <button
                                onClick={() => setOpenEditModal(false)}
                                className="bg-gray-300 text-gray-800 px-6 py-3 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit(handleFormUpdate)}
                                disabled={loading}
                                className="relative bg-[#4318ff] text-white px-6 py-3 rounded-lg flex items-center ml-auto max-w-xs"
                            >
                                {loading ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-6 h-6 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 bg-white shadow-lg rounded-lg p-6">
                <table className="w-full table-auto">
                    <thead>
                        <tr className="text-gray-600">
                            <th className="px-6 py-4 text-left">
                                <div className="flex justify-between items-center">
                                    <input
                                        type="checkbox"
                                        checked={false}
                                        onChange={() => {
                                            if (selectedRows.length === getPaginatedData().length) {
                                                setSelectedRows([]);
                                            } else {
                                                setSelectedRows(getPaginatedData().map((row) => row.id));
                                            }
                                        }}
                                    />
                                </div>
                            </th>
                            <th className="px-6 py-4 text-left">Role Name</th>
                            <th className="">
                                {selectedRows.length > 0 && (
                                    <button
                                        onClick={handleBulkDelete}
                                        className={`text-gray-600 hover:text-red-600 text-xl flex items-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <div className="relative">
                                                <div className="w-6 h-6 border-4 border-t-transparent border-red-600 rounded-full animate-spin"></div>
                                            </div>
                                        ) : (
                                            <FaTrashAlt />
                                        )}
                                    </button>
                                )}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {getPaginatedData().length > 0 ? (
                            getPaginatedData().map((role) => (
                                <tr key={role.id} className="border-t">
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.includes(role.id)}
                                            onChange={() => handleRowSelection(role.id)}
                                        />
                                    </td>
                                    <td className="px-1 py-4">{role.name}</td>
                                    <td className="text-left">
                                        <div className="relative inline-flex items-center group">
                                            <button
                                                onClick={() => handleEditRow(role)}
                                                className="text-blue-700 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => setOpenDropdown(openDropdown === role.id ? null : role.id)}
                                                className="text-gray-600 hover:text-gray-900 ml-2"
                                            >
                                                <FaEllipsisV />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                    No data found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-4">
                <div className="flex items-center">
                    <span className="mr-2">Show</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="border border-gray-300 px-4 py-2 rounded-md"
                    >
                        {[5, 10, 20, 50, 100].map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                    <span className="ml-2">entries</span>
                </div>
                <div className="flex space-x-4">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`${currentPage === 1
                            ? 'bg-[#4318ff] text-white opacity-50 cursor-not-allowed'
                            : 'bg-[#4318ff] text-white hover:bg-[#3700b3]'
                            } px-6 py-2 rounded-[20px]`}
                    >
                        Back
                    </button>
                    <span className="text-gray-600 mt-2">
                        {` ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems} items`}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`${currentPage === totalPages || totalItems === 0
                            ? 'bg-[#4318ff] text-white opacity-50 cursor-not-allowed'
                            : 'bg-[#4318ff] text-white hover:bg-[#3700b3]'
                            } px-6 py-2 rounded-[20px]`}
                    >
                        Next
                    </button>
                </div>
            </div>

            {openDeleteDialog && (
                <div className="fixed inset-0 flex items-center justify-center z-20 bg-gray-500 bg-opacity-50">
                    <div className="bg-white p-6 rounded-md shadow-lg w-1/3">
                        <h2 className="text-xl font-semibold mb-4">Are you sure you want to delete this Role?</h2>
                        <div className="flex justify-end">
                            <button
                                onClick={handleCancelDelete}
                                className="px-4 py-2 mr-4 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirmation}
                                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center justify-center"
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <FaSpinner className="animate-spin mr-2" />
                                ) : (
                                    'Delete'
                                )}
                                {isDeleting ? 'Deleting...' : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Role;