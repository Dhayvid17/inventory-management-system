"use client";

import { useAuthContext } from "@/app/hooks/useAuthContext";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Spinner from "@/app/components/Spinner";
import { InventoryMovement, FilterParams } from "@/app/types/analyticsReport";

//LOGIC TO DISPLAY INVENTORY MOVEMENT PAGE
const InventoryMovementPage: React.FC = () => {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    limit: 10,
  });
  const [totalPages, setTotalPages] = useState(1);

  const { state } = useAuthContext();
  const router = useRouter();

  const transactionTypes = [
    "All Types",
    "Restock Transaction",
    "Sales Transaction",
    "Customer Return",
    "Supplier Return",
    "Inter-Warehouse Transfer",
  ];

  useEffect(() => {
    if (state.isLoading) return;

    if (!state.isAuthenticated) {
      router.push("/users/login");
      return;
    }

    //Fetch Inventory Movement from Backend API
    const fetchMovements = async () => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams({
          page: filters.page.toString(),
          limit: filters.limit.toString(),
          ...(filters.startDate && { startDate: filters.startDate }),
          ...(filters.endDate && { endDate: filters.endDate }),
          ...(filters.warehouseId && { warehouseId: filters.warehouseId }),
          ...(filters.productId && { productId: filters.productId }),
          ...(filters.transactionType &&
            filters.transactionType !== "All Types" && {
              transactionType: filters.transactionType,
            }),
        });

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/analytics/inventory-movement?${queryParams}`,
          {
            headers: {
              Authorization: `Bearer ${state.token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/users/login");
            return;
          }
          throw new Error("Failed to fetch inventory movements");
        }
        const data = await response.json();
        setMovements(data.data);
        setTotalPages(Math.ceil(data.count / filters.limit));
      } catch (error: any) {
        setError(error.message);
        console.error("Error fetching Inventory Movement:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovements();
  }, [state.isLoading, state.isAuthenticated, state.token, filters, router]);

  //Function to get the status color based on transaction type
  const getStatusColor = (type: string) => {
    switch (type) {
      case "Restock Transaction":
        return "bg-green-100 text-green-800";
      case "Sales Transaction":
        return "bg-blue-100 text-blue-800";
      case "Customer Return":
        return "bg-yellow-100 text-yellow-800";
      case "Supplier Return":
        return "bg-orange-100 text-orange-800";
      case "Inter-Warehouse Transfer":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  //Function to handle applying filters
  const handleApplyFilters = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  //Function to clear filters
  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: filters.limit,
    });
  };

  //DISPLAY SPINNER WHEN ISLOADING
  if (state.isLoading) {
    return <Spinner />;
  }

  //DISPLAY ERROR MESSAGE
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 sm:px-6 py-4 rounded-lg shadow-md w-full max-w-md mx-auto relative"
          role="alert"
        >
          <strong className="font-bold text-base sm:text-lg">Error:</strong>
          <span className="block sm:inline ml-0 sm:ml-2 mt-1 sm:mt-0">
            {error}
          </span>
          <button
            className="absolute top-2 right-2 text-red-500 hover:text-red-700 focus:outline-none"
            onClick={() => setError(null)}
            aria-label="Close error message"
          >
            <svg
              className="h-5 w-5 sm:h-6 sm:w-6"
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
    <div className="min-h-screen bg-gray-50">
      <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
            Inventory Movement
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1">
            Track product movements and transactions
          </p>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-lg shadow mb-4 sm:mb-6 p-3 sm:p-4">
          <h2 className="text-base sm:text-lg font-medium text-gray-700 mb-3">
            Filters
          </h2>
          <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={filters.startDate || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={filters.endDate || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Transaction Type
              </label>
              <select
                className="w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={filters.transactionType || "All Types"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFilters((prev) => ({
                    ...prev,
                    transactionType: e.target.value,
                  }))
                }
              >
                {transactionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <div className="flex space-x-2">
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md transition duration-200 text-sm font-medium"
                >
                  Apply
                </button>
                <button
                  onClick={clearFilters}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-3 rounded-md transition duration-200 text-sm font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Spinner />
          </div>
        ) : movements.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 sm:p-8 text-center">
            <svg
              className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No inventory movements found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or check back later.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View - Card Layout */}
            <div className="block lg:hidden space-y-3">
              {movements.map((movement, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border p-4"
                >
                  {/* Header Section */}
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        movement.transactionType
                      )}`}
                    >
                      {movement.transactionType}
                    </span>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        ${movement.totalValue.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(
                          movement.transactionDate
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Products Section */}
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      Products
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-xs">
                      {movement.products
                        .map(
                          (p: { name: string; quantity: number }) =>
                            `${p.name} (${p.quantity})`
                        )
                        .join(", ")}
                    </div>
                  </div>

                  {/* Location and Staff */}
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <span className="text-xs font-medium text-gray-500">
                        Location:{" "}
                      </span>
                      <span className="text-xs text-gray-700">
                        {movement.warehouseName ||
                          (movement.fromWarehouseName &&
                          movement.toWarehouseName
                            ? `${movement.fromWarehouseName} → ${movement.toWarehouseName}`
                            : "N/A")}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">
                        Staff:{" "}
                      </span>
                      <span className="text-xs text-gray-700">
                        {movement.staffName}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View - Table Layout */}
            <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Products
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Staff
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {movements.map((movement, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(
                            movement.transactionDate
                          ).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                              movement.transactionType
                            )}`}
                          >
                            {movement.transactionType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <div className="max-w-xs truncate">
                            {movement.products
                              .map(
                                (p: { name: string; quantity: number }) =>
                                  `${p.name} (${p.quantity})`
                              )
                              .join(", ")}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {movement.warehouseName ||
                            (movement.fromWarehouseName &&
                            movement.toWarehouseName
                              ? `${movement.fromWarehouseName} → ${movement.toWarehouseName}`
                              : "N/A")}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          ${movement.totalValue.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {movement.staffName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-4 sm:mt-6">
              {/* Mobile Pagination */}
              <div className="flex flex-col space-y-3 lg:hidden">
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1),
                      }))
                    }
                    disabled={filters.page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-700 flex items-center">
                    {filters.page} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        page: Math.min(totalPages, prev.page + 1),
                      }))
                    }
                    disabled={filters.page === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="text-center text-xs text-gray-500">
                  Showing {(filters.page - 1) * filters.limit + 1} to{" "}
                  {Math.min(
                    filters.page * filters.limit,
                    totalPages * filters.limit
                  )}{" "}
                  of {totalPages * filters.limit} entries
                </div>
              </div>

              {/* Desktop Pagination */}
              <div className="hidden lg:flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-700">
                  <span>Showing </span>
                  <span className="font-medium mx-1">
                    {(filters.page - 1) * filters.limit + 1}
                  </span>
                  <span>to</span>
                  <span className="font-medium mx-1">
                    {Math.min(
                      filters.page * filters.limit,
                      totalPages * filters.limit
                    )}
                  </span>
                  <span>of</span>
                  <span className="font-medium ml-1">
                    {totalPages * filters.limit}
                  </span>
                  <span> entries</span>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, page: 1 }))}
                    disabled={filters.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">First</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1),
                      }))
                    }
                    disabled={filters.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {/* Page numbers for desktop */}
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    const isActive = pageNum === filters.page;
                    return (
                      <button
                        key={i}
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, page: pageNum }))
                        }
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          isActive
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        page: Math.min(totalPages, prev.page + 1),
                      }))
                    }
                    disabled={filters.page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: totalPages }))
                    }
                    disabled={filters.page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Last</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 6.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0zm6 0a1 1 0 010-1.414L14.586 10l-4.293-3.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InventoryMovementPage;
