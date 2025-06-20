"use client";

import { useAuthContext } from "@/app/hooks/useAuthContext";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Spinner from "@/app/components/Spinner";
import { InventoryAging } from "@/app/types/analyticsReport";
import { Clock, AlertTriangle } from "lucide-react";

//LOGIC TO DISPLAY THE INVENTORY AGING PAGE
const InventoryAgingPage: React.FC = () => {
  const [agingData, setAgingData] = useState<InventoryAging[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [warehouses, setWarehouses] = useState<
    Array<{ _id: string; name: string }>
  >([]);

  const { state } = useAuthContext();
  const isAdmin = state.user?.role === "admin";
  const router = useRouter();

  useEffect(() => {
    if (state.isLoading) return; //Wait until loading is false

    if (!state.isAuthenticated) {
      router.push("/users/login");
      return;
    }

    //Fetch Warehouses for the filter dropdown from Backend API
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
            //Token might be Invalid or expired
            router.push("/users/login");
            return;
          }
          throw new Error("Failed to fetch Warehouses");
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
  }, [state.isLoading, state.isAuthenticated, isAdmin, state.token, router]);

  //Fetch Inventory Aging from Backend API
  useEffect(() => {
    const fetchAgingData = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (warehouseId) {
          queryParams.append("warehouseId", warehouseId);
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/analytics/inventory-aging?${queryParams}`,
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
          throw new Error("Failed to fetch Inventory Aging data");
        }
        const data = await response.json();
        setAgingData(data.data);
      } catch (error: any) {
        setError(error.message);
        console.error("Error fetching Inventory Aging data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (state.isAuthenticated) {
      fetchAgingData();
    }
  }, [state.isAuthenticated, state.token, warehouseId, router]);

  //RenderAgeStatus function
  const getAgeStatusColor = (category: string) => {
    switch (category) {
      case "Fresh (< 30 days)":
        return "bg-green-50 text-green-600";
      case "Normal (30-60 days)":
        return "bg-blue-50 text-blue-600";
      case "Aging (60-90 days)":
        return "bg-yellow-50 text-yellow-600";
      case "Old (> 90 days)":
        return "bg-red-50 text-red-600";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };

  //Rendering for age status with color coding
  const renderAgeStatus = (ageInDays: number, ageCategory: string) => {
    return (
      <div className="flex flex-col">
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold 
          ${
            ageCategory === "Fresh (< 30 days)"
              ? "bg-green-100 text-green-800"
              : ageCategory === "Normal (30-60 days)"
              ? "bg-blue-100 text-blue-800"
              : ageCategory === "Aging (60-90 days)"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {ageCategory}
        </span>
        <span className="text-sm text-gray-500 mt-1">{ageInDays} days</span>
      </div>
    );
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
            onClick={() => {
              /* Add your close handler here */
            }}
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

  //Safe date formatting
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Inventory Aging Report
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Analyze product age distribution in inventory
        </p>
      </div>

      {/* Filters - Only show for admin */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow mb-4 sm:mb-6 p-4">
          <div className="w-full sm:max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warehouse
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              <option value="">All Warehouses</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse._id} value={warehouse._id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 sm:mb-6">
        {[
          "Fresh (< 30 days)",
          "Normal (30-60 days)",
          "Aging (60-90 days)",
          "Old (> 90 days)",
        ].map((category) => {
          const count = agingData.filter(
            (item) => item.ageCategory === category
          ).length;
          return (
            <div
              key={category}
              className={`p-3 sm:p-4 rounded-lg ${getAgeStatusColor(
                category
              )} border`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium">{category}</p>
                  <p className="text-lg sm:text-2xl font-bold">{count}</p>
                </div>
                {category === "Old (> 90 days)" && count > 0 ? (
                  <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8" />
                ) : (
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Aging Table - Desktop and Mobile Views */}
      {agingData.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Mobile View - Card Layout */}
          <div className="block md:hidden">
            {agingData.map((item, index) => (
              <div key={index} className="p-4 border-b border-gray-200">
                <div className="space-y-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      {item.productName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.warehouseName}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Quantity:</span>
                    <span className="font-medium">{item.quantity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Last Movement:
                    </span>
                    <span>{formatDate(item.lastMovementDate)}</span>
                  </div>
                  <div>{renderAgeStatus(item.ageInDays, item.ageCategory)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop/Tablet View - Table Layout */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Movement
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agingData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.productName}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.warehouseName}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.lastMovementDate)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {renderAgeStatus(item.ageInDays, item.ageCategory)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          No Inventory Aging Data Found
        </div>
      )}
    </div>
  );
};

export default InventoryAgingPage;
