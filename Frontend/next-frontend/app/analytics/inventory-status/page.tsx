"use client";

import { useAuthContext } from "@/app/hooks/useAuthContext";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Spinner from "@/app/components/Spinner";
import { InventoryStatus, FilterParams } from "@/app/types/analyticsReport";
import {
  BarChart,
  TrendingDown,
  TrendingUp,
  Filter,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

//LOGIC TO DISPLAY THE INVENTORY STATUS PAGE
const InventoryStatusPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryStatus[]>([]);
  const [warehouses, setWarehouses] = useState<
    Array<{ _id: string; name: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    limit: 50,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const { state } = useAuthContext();
  const isAdmin = state.user?.role === "admin";
  const router = useRouter();

  useEffect(() => {
    if (state.isLoading) return; //Wait until loading is false

    if (!state.isAuthenticated) {
      router.push("/users/login");
      return;
    }

    if (isAdmin) {
      //FETCH WAREHOUSE DATA FROM THE BACKEND API
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
          if (!response.ok) {
            if (response.status === 401) {
              //Token might be Invalid/expired
              router.push("/users/login");
              return;
            }
            throw new Error("Failed to fetch warehouses");
          }
          const data = await response.json();
          setWarehouses(data);
        } catch (error: any) {
          setError(error.message);
          console.error("Error fetching warehouses:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchWarehouses();
    }

    //Fetch Inventory Status from Backend API
    const fetchInventoryStatus = async () => {
      try {
        const queryParams = new URLSearchParams({
          page: filters.page.toString(),
          limit: filters.limit.toString(),
          ...(filters.warehouseId && { warehouseId: filters.warehouseId }),
          ...(filters.categoryId && { categoryId: filters.categoryId }),
          ...(filters.startDate && { startDate: filters.startDate }),
          ...(filters.endDate && { endDate: filters.endDate }),
        });

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/analytics/inventory-status?${queryParams}`,
          {
            headers: {
              Authorization: `Bearer ${state.token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            //Token might be Invalid/expired
            router.push("/users/login");
            return;
          }
          throw new Error("Failed to fetch inventory status");
        }
        const data = await response.json();
        setInventory(data.data);
        setTotalItems(data.count);
        setTotalPages(Math.ceil(data.count / filters.limit));
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventoryStatus();
  }, [
    state.isLoading,
    state.isAuthenticated,
    state.token,
    filters,
    router,
    isAdmin,
  ]);

  //REFRESH DATA
  const refreshData = () => {
    setIsLoading(true);
    setFilters((prev) => ({ ...prev })); //This will trigger the useEffect to fetch data again
  };

  //RESET FILTERS
  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 50,
    });
  };

  //GET TREND ICON BASED ON QUANTITY
  const getTrendIcon = (quantity: number) => {
    if (quantity > 20) return <TrendingUp className="text-green-500 w-5 h-5" />;
    if (quantity > 10) return <BarChart className="text-yellow-500 w-5 h-5" />;
    return <TrendingDown className="text-red-500 w-5 h-5" />;
  };

  //GET STATUS BADGE BASED ON QUANTITY
  const getStatusBadge = (quantity: number) => {
    if (quantity > 20) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          {quantity} <span className="hidden sm:inline">in stock</span>
        </span>
      );
    } else if (quantity > 10) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          {quantity} <span className="hidden sm:inline">in stock</span>
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          {quantity} <span className="hidden sm:inline">in stock</span>
        </span>
      );
    }
  };

  //DISPLAY SPINNER WHEN ISLOADING
  if (state.isLoading) {
    return <Spinner />;
  }

  //DISPLAY ERROR MESSAGE
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md max-w-md mx-auto relative"
          role="alert"
        >
          <strong className="font-bold text-lg">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
          <button
            className="absolute top-2 right-2 text-red-500 hover:text-red-700 focus:outline-none"
            onClick={() => setError(null)}
            aria-label="Close error message"
          >
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M14.348 5.652a1 1 0 00-1.414 0L10 8.586 7.066 5.652a1 1 0 10-1.414 1.414L8.586 10l-2.934 2.934a1 1 0 101.414 1.414L10 11.414l2.934 2.934a1 1 0 001.414-1.414L11.414 10l2.934-2.934a1 1 0 000-1.414z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Inventory Status
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Current stock levels and values across warehouses
          </p>
        </div>

        <div className="flex mt-3 sm:mt-0 space-x-2">
          <button
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>

          <button
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={refreshData}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>
      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4 mb-4 sm:mb-6 transition-all duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Warehouse Filter - Only for Admin */}
            {isAdmin && (
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warehouse
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={filters.warehouseId || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      warehouseId: e.target.value || undefined,
                      page: 1, //Reset to first page on filter change
                    }))
                  }
                >
                  <option value="">All Warehouses</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range Filters */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={filters.startDate || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    startDate: e.target.value || undefined,
                    page: 1, // Reset to first page on filter change
                  }))
                }
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={filters.endDate || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    endDate: e.target.value || undefined,
                    page: 1, //Reset to first page on filter change
                  }))
                }
              />
            </div>

            {/* Reset Filters Button */}
            <div className="col-span-1 flex items-end">
              <button
                onClick={resetFilters}
                className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Inventory Data Display */}
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <Spinner />
        </div>
      ) : inventory.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-500 font-medium">
            No inventory data found
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Try adjusting your filters or check back later
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Mobile View - Single Column Cards (up to 640px) */}
          <div className="block sm:hidden">
            <div className="grid grid-cols-1 gap-4 p-4">
              {inventory.map((item, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900 text-lg">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {item.supplierName}
                        </p>
                      </div>
                      {getTrendIcon(item.quantity)}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          Warehouse
                        </span>
                        <p className="text-sm text-gray-900">
                          {item.warehouseName}
                        </p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          Category
                        </span>
                        <p className="text-sm text-gray-900">
                          {item.categoryName}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          Quantity
                        </span>
                        <div className="mt-1">
                          {getStatusBadge(item.quantity)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          Value
                        </span>
                        <p className="text-sm font-medium text-gray-900">
                          ${item.totalValue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medium Screen View - Compact Grid Cards (640px-1279px) */}
          <div className="hidden sm:block xl:hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {inventory.map((item, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 text-base truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {item.supplierName}
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        {getTrendIcon(item.quantity)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          Warehouse
                        </span>
                        <p className="text-xs text-gray-900 text-right truncate max-w-24">
                          {item.warehouseName}
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          Category
                        </span>
                        <p className="text-xs text-gray-900 text-right truncate max-w-24">
                          {item.categoryName}
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          Quantity
                        </span>
                        <div>{getStatusBadge(item.quantity)}</div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          Value
                        </span>
                        <p className="text-sm font-medium text-gray-900">
                          ${item.totalValue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Large Screen View - Full Table Layout (1280px+) */}
          <div className="hidden xl:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Product
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Warehouse
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Category
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Quantity
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Value
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.supplierName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.warehouseName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.categoryName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.quantity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${item.totalValue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTrendIcon(item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="bg-white px-4 py-4 border-t border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="mb-4 sm:mb-0 text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(filters.page - 1) * filters.limit + 1}
                </span>
                {" - "}
                <span className="font-medium">
                  {Math.min(filters.page * filters.limit, totalItems)}
                </span>{" "}
                of <span className="font-medium">{totalItems}</span> results
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={filters.page === 1}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="text-sm font-medium text-gray-700">
                  Page <span className="font-bold">{filters.page}</span> of{" "}
                  <span>{totalPages}</span>
                </div>

                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={filters.page >= totalPages}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryStatusPage;
