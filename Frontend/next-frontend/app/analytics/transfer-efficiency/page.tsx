"use client";

import { useAuthContext } from "@/app/hooks/useAuthContext";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Spinner from "@/app/components/Spinner";
import { TransferEfficiencyMetrics } from "@/app/types/analyticsReport";
import {
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";

//Get Transfer Efficiency Metrics Type
type WarehousePair = {
  fromWarehouse: string;
  toWarehouse: string;
  totalTransfers: number;
  completedTransfers: number;
  failedTransfers: number;
  pendingTransfers: number;
  totalValue: number;
  successRate: string;
};

//LOGIC TO DISPLAY TRANSFER EFFICIENCY PAGE
const TransferEfficiencyPage: React.FC = () => {
  const [metrics, setMetrics] = useState<TransferEfficiencyMetrics | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const { state } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (state.isLoading) return; //Wait until loading is false

    if (!state.isAuthenticated) {
      router.push("/users/login");
      return;
    }

    //Fetch Transfer Efficiency Data from Backend API
    const fetchMetrics = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (dateRange.startDate)
          queryParams.append("startDate", dateRange.startDate);
        if (dateRange.endDate) queryParams.append("endDate", dateRange.endDate);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/analytics/transfer-efficiency?${queryParams}`,
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
          throw new Error("Failed to fetch transfer efficiency metrics");
        }
        const data = await response.json();
        setMetrics(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [state.isLoading, state.isAuthenticated, state.token, dateRange, router]);

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

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Transfer Efficiency
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Monitor warehouse transfer performance and success rates
        </p>
      </div>

      {/* Date Range Filters */}
      <div className="bg-white rounded-lg shadow mb-4 sm:mb-6 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Total Transfers
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">
                  {metrics.summary.totalTransfers}
                </p>
              </div>
              <ArrowRightLeft className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Completed
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">
                  {metrics.summary.completedTransfers}
                </p>
              </div>
              <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Failed
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">
                  {metrics.summary.failedTransfers}
                </p>
              </div>
              <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Success
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">
                  {metrics.summary.successRate}
                </p>
              </div>
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Pairs Table */}
      {/* Warehouse Pairs Table */}
      {metrics && metrics.warehousePairs.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Mobile View - Card Layout (up to 640px) */}
          <div className="block sm:hidden">
            {metrics.warehousePairs.map(
              (pair: WarehousePair, index: number) => (
                <div key={index} className="p-4 border-b border-gray-200">
                  <div className="mb-2">
                    <div className="font-medium text-gray-900">
                      {pair.fromWarehouse} → {pair.toWarehouse}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total:</span>
                      <span className="text-sm font-medium">
                        {pair.totalTransfers}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Completed:</span>
                      <span className="px-2 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {pair.completedTransfers}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Failed:</span>
                      <span className="px-2 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        {pair.failedTransfers}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">
                        Success Rate:
                      </span>
                      <span className="text-sm font-medium">
                        {pair.successRate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Value:</span>
                      <span className="text-sm font-medium">
                        ${pair.totalValue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Medium Screen View - Compact Cards (640px-1040px) */}
          <div className="hidden sm:block xl:hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {metrics.warehousePairs.map(
                (pair: WarehousePair, index: number) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="mb-3">
                      <div className="font-medium text-gray-900 text-sm">
                        {pair.fromWarehouse} → {pair.toWarehouse}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total:</span>
                        <span className="font-medium">
                          {pair.totalTransfers}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Success:</span>
                        <span className="font-medium">{pair.successRate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Completed:</span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {pair.completedTransfers}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Failed:</span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {pair.failedTransfers}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Pending:</span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {pair.pendingTransfers}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Value:</span>
                        <span className="font-medium">
                          ${pair.totalValue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Large Screen View - Full Table Layout (1280px+) */}
          <div className="hidden xl:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Failed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.warehousePairs.map(
                  (pair: WarehousePair, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {pair.fromWarehouse} → {pair.toWarehouse}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pair.totalTransfers}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {pair.completedTransfers}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {pair.failedTransfers}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {pair.pendingTransfers}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pair.successRate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${pair.totalValue.toFixed(2)}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {metrics && metrics.warehousePairs.length === 0 && (
        <div className="text-center py-6 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            No transfer data available for the selected period
          </p>
        </div>
      )}
    </div>
  );
};

export default TransferEfficiencyPage;
