"use client";

import { useAuthContext } from "@/app/hooks/useAuthContext";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Spinner from "@/app/components/Spinner";
import { DashboardSummary } from "@/app/types/analyticsReport";
import { BarChart3, Boxes, AlertTriangle, Building2 } from "lucide-react";

//LOGIC TO DISPLAY THE DASHBOARD SUMMARY PAGE
const DashboardSummaryPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { state } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (state.isLoading) return; //Wait until loading is false

    if (!state.isAuthenticated) {
      router.push("/users/login");
      return;
    }

    //Fetch DashBoard Summary from Backend API
    const fetchDashboardSummary = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/analytics/dashboard-summary`,
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
          throw new Error("Failed to fetch Dashboard Summary");
        }
        const data = await response.json();
        setSummary(data.data);
      } catch (error: any) {
        setError(error.message);
        console.error("Error fetching DashBoard Summary:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardSummary();
  }, [state.isLoading, state.isAuthenticated, state.token, router]);

  //Display Spinner when isLoading
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Summary</h1>
        <p className="text-gray-600 mt-1">Overview of key inventory metrics</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Warehouses
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.warehouseCount}
              </p>
            </div>
            <Building2 className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Inventory Value
              </p>
              <p className="text-2xl font-bold text-green-600">
                ${summary?.inventoryValue.toFixed(2)}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Quantity
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.inventoryQuantity}
              </p>
            </div>
            <Boxes className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Transaction Types and Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Transactions by Type
          </h2>
          <div className="space-y-4">
            {summary?.transactionsByType.map((type) => (
              <div key={type._id} className="flex items-center justify-between">
                <span className="text-gray-600">{type._id}</span>
                <span className="text-gray-900 font-medium">{type.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Products by Category
          </h2>
          <div className="space-y-4">
            {summary?.productsByCategory.map((category) => (
              <div
                key={category._id}
                className="flex items-center justify-between"
              >
                <span className="text-gray-600">
                  {category._id || "Uncategorized"}
                </span>
                <div className="text-right">
                  <p className="text-gray-900 font-medium">
                    {category.count} items
                  </p>
                  <p className="text-sm text-gray-500">
                    ${category.totalValue.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Products */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold text-gray-800">
            Low Stock Products
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summary?.lowStockProducts.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      {product.quantity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isLoading ? (
        <Spinner />
      ) : (
        !summary && (
          <div className="text-center py-4 text-gray-500">
            No DashBoard Summary Found
          </div>
        )
      )}
    </div>
  );
};

export default DashboardSummaryPage;
