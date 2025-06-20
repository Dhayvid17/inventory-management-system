"use client";

import { useAuthContext } from "@/app/hooks/useAuthContext";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Spinner from "@/app/components/Spinner";
import { BalanceSheetData } from "@/app/types/balanceSheet";
import {
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Calendar,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Filter,
  XCircle,
  ChevronDown,
} from "lucide-react";

interface Warehouse {
  _id: string;
  name: string;
}

//LOGIC TO DISPLAY THE BALANCE SHEET PAGE
const BalanceSheetPage = () => {
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [filters, setFilters] = useState({
    warehouseId: "",
    timeRange: "month",
    customStartDate: "",
    customEndDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const { state } = useAuthContext();
  const router = useRouter();

  const isAdmin = state.user?.role === "admin";

  useEffect(() => {
    if (state.isLoading) return;

    if (!state.isAuthenticated) {
      router.push("/users/login");
      return;
    }

    //Check if user is admin
    if (!isAdmin) {
      setIsLoading(false); //No longer loading
      setError("You are not authorized to edit this transaction.");
      router.push("/unauthorized"); //Redirect to unauthorized page
      return;
    }

    //Fetch warehouses and initial balance sheet data
    const fetchData = async () => {
      try {
        const [warehousesRes, balanceSheetRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses`, {
            headers: { Authorization: `Bearer ${state.token}` },
          }),
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/analytics/balance-sheet?timeRange=${filters.timeRange}`,
            {
              headers: { Authorization: `Bearer ${state.token}` },
            }
          ),
        ]);

        if (!warehousesRes.ok || !balanceSheetRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const warehousesData = await warehousesRes.json();
        const balanceSheetData = await balanceSheetRes.json();

        setWarehouses(warehousesData);
        setBalanceSheet(balanceSheetData);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [state.isLoading, state.isAuthenticated, isAdmin, state.token, router]);

  //Fetch balance sheet data based on filters
  const fetchBalanceSheet = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        timeRange: filters.timeRange,
        ...(filters.warehouseId && { warehouseId: filters.warehouseId }),
        ...(filters.timeRange === "custom" && {
          customStartDate: filters.customStartDate,
          customEndDate: filters.customEndDate,
        }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/balance-sheet?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${state.token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch balance sheet");
      }

      const data = await response.json();
      setBalanceSheet(data);
      //Hide filters on mobile after update
      if (window.innerWidth < 768) {
        setShowFilters(false);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  //Time range display helper
  const getTimeRangeDisplay = () => {
    switch (filters.timeRange) {
      case "day":
        return "Today";
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "year":
        return "This Year";
      case "all":
        return "All Time";
      case "custom":
        if (filters.customStartDate && filters.customEndDate) {
          return `${new Date(
            filters.customStartDate
          ).toLocaleDateString()} - ${new Date(
            filters.customEndDate
          ).toLocaleDateString()}`;
        }
        return "Custom Range";
      default:
        return "This Month";
    }
  };

  //Warehouse display helper
  const getWarehouseDisplay = () => {
    if (!filters.warehouseId) return "All Warehouses";
    const warehouse = warehouses.find((w) => w._id === filters.warehouseId);
    return warehouse ? warehouse.name : "All Warehouses";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Header with Responsive Filters Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="h-7 w-7 text-blue-600 mr-2 hidden sm:inline-block" />
              Balance Sheet
            </h1>
            <p className="mt-1 text-sm sm:text-base text-gray-500">
              <span className="inline-flex items-center mr-3">
                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                {getTimeRangeDisplay()}
              </span>
              <span className="inline-flex items-center">
                <Building2 className="h-4 w-4 mr-1 text-gray-400" />
                {getWarehouseDisplay()}
              </span>
            </p>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-150 ease-in-out"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            <ChevronDown
              className={`h-4 w-4 ml-1 transform transition-transform duration-200 ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Filters Panel - Collapsible on Mobile */}
        <div
          className={`${
            showFilters
              ? "max-h-screen opacity-100"
              : "max-h-0 opacity-0 sm:max-h-screen sm:opacity-100"
          } overflow-hidden transition-all duration-300 ease-in-out`}
        >
          <div className="bg-white rounded-lg shadow-sm p-5 mb-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warehouse
                </label>
                <select
                  value={filters.warehouseId}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      warehouseId: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-10 transition-colors duration-150"
                >
                  <option value="">All Warehouses</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Range
                </label>
                <select
                  value={filters.timeRange}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      timeRange: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-10 transition-colors duration-150"
                >
                  <option value="day">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Range</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              {filters.timeRange === "custom" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.customStartDate}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          customStartDate: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-10 transition-colors duration-150"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.customEndDate}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          customEndDate: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-10 transition-colors duration-150"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => {
                  setFilters({
                    warehouseId: "",
                    timeRange: "month",
                    customStartDate: "",
                    customEndDate: "",
                  });
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3 transition-colors duration-150"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reset
              </button>
              <button
                onClick={fetchBalanceSheet}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Update Report
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px] bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <Spinner />
              <p className="mt-4 text-gray-500">
                Loading balance sheet data...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 my-6 rounded-r-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <p className="mt-2 text-sm text-red-600">
                  Please try refreshing the page or check your connection.
                </p>
              </div>
            </div>
          </div>
        ) : balanceSheet ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
              {/* Starting Value Card */}
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow duration-200 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Starting Value
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                      ${balanceSheet.summary.startingInventoryValue.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Initial inventory valuation
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-gray-500" />
                  </div>
                </div>
              </div>

              {/* Total Inflow Card */}
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow duration-200 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Total Inflow
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">
                      ${balanceSheet.summary.totalInflow.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Value of added inventory
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <ArrowUpRight className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </div>

              {/* Total Outflow Card */}
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow duration-200 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Total Outflow
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-red-600 mt-1">
                      ${balanceSheet.summary.totalOutflow.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Value of removed inventory
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <ArrowDownRight className="h-6 w-6 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Ending Value Card */}
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow duration-200 transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Ending Value
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">
                      ${balanceSheet.summary.endingInventoryValue.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Current inventory valuation
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Net Change Card */}
            <div className="bg-white rounded-lg shadow-sm p-5 mb-6 border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Net Inventory Change
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div className="mb-3 sm:mb-0">
                  <div className="flex items-center">
                    <span className="text-2xl font-bold mr-2 text-gray-900">
                      $
                      {(
                        balanceSheet.summary.endingInventoryValue -
                        balanceSheet.summary.startingInventoryValue
                      ).toFixed(2)}
                    </span>
                    {balanceSheet.summary.endingInventoryValue >=
                    balanceSheet.summary.startingInventoryValue ? (
                      <span className="flex items-center text-green-600 text-sm font-medium">
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        {(
                          (balanceSheet.summary.endingInventoryValue /
                            balanceSheet.summary.startingInventoryValue -
                            1) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600 text-sm font-medium">
                        <ArrowDownRight className="h-4 w-4 mr-1" />
                        {(
                          (1 -
                            balanceSheet.summary.endingInventoryValue /
                              balanceSheet.summary.startingInventoryValue) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Change during selected period
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Movement Ratio</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {(
                        ((balanceSheet.summary.totalInflow +
                          balanceSheet.summary.totalOutflow) /
                          (balanceSheet.summary.startingInventoryValue || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Turnover</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {(
                        (balanceSheet.summary.totalOutflow /
                          (balanceSheet.summary.startingInventoryValue || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Movement Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                  <RefreshCw className="h-5 w-5 text-blue-500 mr-2" />
                  Product Movement Details
                </h3>
              </div>

              {/* Mobile View */}
              <div className="block md:hidden">
                {Object.values(balanceSheet.summary.productMovement).map(
                  (product) => (
                    <div
                      key={product.productId}
                      className="p-4 border-b border-gray-200 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-gray-900">
                          {product.name}
                        </h4>
                        <span className="text-sm font-medium text-gray-900">
                          ${product.currentValue.toFixed(2)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-xs text-gray-500">Start Qty</div>
                          <div className="text-sm font-medium">
                            {product.startQty.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-xs text-gray-500">End Qty</div>
                          <div className="text-sm font-medium">
                            {product.endQty.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <div className="text-xs text-green-600">Total In</div>
                          <div className="text-sm font-medium text-green-700">
                            +{product.totalInflow.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-red-50 p-2 rounded">
                          <div className="text-xs text-red-600">Total Out</div>
                          <div className="text-sm font-medium text-red-700">
                            -{product.totalOutflow.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}

                {/* Mobile Summary Card */}
                <div className="p-4 bg-gray-50">
                  <div className="text-sm font-medium text-gray-500 mb-3">
                    Summary
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-2 rounded shadow-sm">
                      <div className="text-xs text-gray-500">Total Start</div>
                      <div className="text-sm font-medium">
                        {Object.values(balanceSheet.summary.productMovement)
                          .reduce((acc, product) => acc + product.startQty, 0)
                          .toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded shadow-sm">
                      <div className="text-xs text-gray-500">Total End</div>
                      <div className="text-sm font-medium">
                        {Object.values(balanceSheet.summary.productMovement)
                          .reduce((acc, product) => acc + product.endQty, 0)
                          .toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded shadow-sm">
                      <div className="text-xs text-green-600">Total Inflow</div>
                      <div className="text-sm font-medium text-green-700">
                        +
                        {Object.values(balanceSheet.summary.productMovement)
                          .reduce(
                            (acc, product) => acc + product.totalInflow,
                            0
                          )
                          .toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded shadow-sm">
                      <div className="text-xs text-red-600">Total Outflow</div>
                      <div className="text-sm font-medium text-red-700">
                        -
                        {Object.values(balanceSheet.summary.productMovement)
                          .reduce(
                            (acc, product) => acc + product.totalOutflow,
                            0
                          )
                          .toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">
                        Total Value
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        ${balanceSheet.summary.endingInventoryValue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop View - Keep existing table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Qty
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total In
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Out
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        End Qty
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.values(balanceSheet.summary.productMovement).map(
                      (product) => (
                        <tr
                          key={product.productId}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {product.startQty.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">
                            +{product.totalInflow.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">
                            -{product.totalOutflow.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {product.endQty.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            ${product.currentValue.toFixed(2)}
                          </td>
                        </tr>
                      )
                    )}
                    {/* Summary row */}
                    <tr className="bg-gray-50 font-medium">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        Total
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {Object.values(balanceSheet.summary.productMovement)
                          .reduce((acc, product) => acc + product.startQty, 0)
                          .toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-700 text-right">
                        +
                        {Object.values(balanceSheet.summary.productMovement)
                          .reduce(
                            (acc, product) => acc + product.totalInflow,
                            0
                          )
                          .toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-700 text-right">
                        -
                        {Object.values(balanceSheet.summary.productMovement)
                          .reduce(
                            (acc, product) => acc + product.totalOutflow,
                            0
                          )
                          .toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {Object.values(balanceSheet.summary.productMovement)
                          .reduce((acc, product) => acc + product.endQty, 0)
                          .toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                        ${balanceSheet.summary.endingInventoryValue.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* Mobile-friendly indicator for horizontal scrolling
              <div className="block sm:hidden text-center text-xs text-gray-500 italic py-2 border-t border-gray-200">
                Swipe horizontally to see more data
              </div> */}
            </div>

            {/* Footer with timestamp */}
            <div className="mt-6 text-center text-xs text-gray-500">
              <p>Report generated on {new Date().toLocaleString()}</p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default BalanceSheetPage;
