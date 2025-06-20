"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAuthContext } from "../hooks/useAuthContext";
import { useRouter } from "next/navigation";
import Spinner from "../components/Spinner";
import { TransferRequest, Warehouse } from "@/app/types/transferRequest";
import Link from "next/link";
import TransferRequestList from "../components/transfer-request/TransferRequestList";
import { Search, Filter, Calendar, Plus, AlertCircle, X } from "lucide-react";

//LOGIC TO DISPLAY THE TRANSFER REQUEST PAGE
const TransferRequestPage: React.FC = () => {
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>(
    []
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState<Warehouse[]>([]);
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  const [filters, setFilters] = useState({
    warehouseSearch: "",
    selectedWarehouseId: "",
    startDate: "",
    endDate: "",
  });

  const { state } = useAuthContext();
  const router = useRouter();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";

  //Fetch Warehouses from Backend API
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/warehouses`,
          {
            headers: {
              Authorization: `Bearer ${state.token}`,
            },
          }
        );
        const data = await response.json();
        setWarehouses(data);
      } catch (error) {
        console.error("Error fetching warehouses:", error);
      }
    };

    if (state.token) {
      fetchWarehouses();
    }
  }, [state.token]);

  //Filter warehouses based on search
  useEffect(() => {
    if (!filters.warehouseSearch) {
      setFilteredWarehouses([]);
      return;
    }

    const filtered = warehouses.filter((warehouse) =>
      warehouse.name
        .toLowerCase()
        .includes(filters.warehouseSearch.toLowerCase())
    );
    setFilteredWarehouses(filtered);
  }, [filters.warehouseSearch, warehouses]);

  //Fetch transfer requests from Backend API
  const fetchTransferRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: "100",
      });

      if (filters.selectedWarehouseId) {
        queryParams.append("warehouseId", filters.selectedWarehouseId);
      }

      if (filters.startDate && filters.endDate) {
        queryParams.append("startDate", filters.startDate);
        queryParams.append("endDate", filters.endDate);
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/transfer-request?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${state.token}`,
          },
        }
      );
      if (!response.ok) {
        if (response.status === 401) {
          //Token might be invalid/expired
          router.push("/users/login");
          return;
        }
        throw new Error(
          `Failed to fetch transfer requests: ${response.statusText}`
        );
      }
      const data = await response.json();
      console.log(data.transferRequests);
      setTransferRequests(data.transferRequests);
      setTotalPages(data.pagination.totalPages);
    } catch (error: any) {
      setError(error.message);
      console.error("Error fetching transfer requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters, state.token, router]);

  //Authentication & Initial Load
  useEffect(() => {
    if (state.isLoading) return;

    if (!state.isAuthenticated) {
      router.push("/users/login");
      return;
    }

    if (!isStaffAdmin) {
      setError("You do not have permission to view this page.");
      router.push("/unauthorized");
      return;
    }

    fetchTransferRequests();
  }, [
    state.isLoading,
    state.isAuthenticated,
    isStaffAdmin,
    fetchTransferRequests,
    router,
  ]);

  //Handler Functions
  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  //Filter and Fetch Transfer Requests
  const handleFilter = () => {
    setCurrentPage(1);
    fetchTransferRequests();
  };

  //Clear Filters and Reset Page
  const clearFilters = () => {
    setFilters({
      warehouseSearch: "",
      selectedWarehouseId: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
  };

  //Display Spinner when IsLoading
  if (state.isLoading) {
    return <Spinner />;
  }

  //DISPLAY ERROR MESSAGE
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white border border-red-200 rounded-xl shadow-lg max-w-md w-full p-6 relative">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Error</h3>
              <p className="text-sm text-gray-600 mt-1">{error}</p>
            </div>
          </div>
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => setError(null)}
            aria-label="Close error message"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Transfer Requests
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and track all transfer requests
              </p>
            </div>
            {isStaffAdmin && (
              <Link
                href="/transfer-request/create"
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Request
              </Link>
            )}
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Warehouse Dropdown */}
            <div className="space-y-2 relative">
              <label
                htmlFor="warehouseSelect"
                className="block text-sm font-medium text-gray-700"
              >
                Select Warehouse
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search warehouse..."
                  value={filters.warehouseSearch}
                  onChange={(e) => {
                    handleFilterChange("warehouseSearch", e.target.value);
                    setShowWarehouseDropdown(true);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {showWarehouseDropdown && filteredWarehouses.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredWarehouses.length > 0 ? (
                      filteredWarehouses.map((warehouse) => (
                        <li
                          key={warehouse._id}
                          onClick={() => {
                            handleFilterChange(
                              "selectedWarehouseId",
                              warehouse._id
                            );
                            handleFilterChange(
                              "warehouseSearch",
                              warehouse.name
                            );
                            setShowWarehouseDropdown(false);
                            setCurrentPage(1);
                          }}
                          className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                            filters.selectedWarehouseId === warehouse._id
                              ? "bg-blue-100"
                              : ""
                          }`}
                        >
                          {warehouse.name}
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-2 text-gray-500">
                        No warehouses found
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700"
              >
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700"
              >
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleFilter}
              className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="inline-flex items-center justify-center px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : transferRequests.length > 0 ? (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Transfer Request List
                </h2>
                <p className="text-gray-600">
                  Showing {transferRequests.length} request
                  {transferRequests.length !== 1 ? "s" : ""} on page{" "}
                  {currentPage} of {totalPages}
                </p>
              </div>

              <TransferRequestList transferRequests={transferRequests} />

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-gray-200 gap-4">
                  <div className="text-sm text-gray-600">
                    Showing page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600 px-4">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Transfer Requests Found
              </h3>
              <p className="text-gray-600 mb-6">
                There are no transfer requests available at the moment.
              </p>
              {isStaffAdmin && (
                <Link
                  href="/transfer-request/create"
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Request
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferRequestPage;
