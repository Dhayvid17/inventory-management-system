"use client";

import { useAuthContext } from "@/app/hooks/useAuthContext";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Spinner from "@/app/components/Spinner";
import { LowStockProduct } from "@/app/types/analyticsReport";
import { AlertTriangle, AlertOctagon, ArrowUpDown, X } from "lucide-react";

//LOGIC TO DISPLAY LOW STOCK PRODUCT PAGE
const LowStockAlertsPage: React.FC = () => {
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<LowStockProduct[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "out" | "low">(
    "all"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof LowStockProduct | "";
    direction: "asc" | "desc";
  }>({ key: "", direction: "asc" });

  const { state } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (state.isLoading) return; //Wait until isLoading is false

    if (!state.isAuthenticated) {
      router.push("/users/login");
      return;
    }

    //Fetch Low Stock Products from Backend API
    const fetchLowStockProducts = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/analytics/low-stock-alerts`,
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
          throw new Error("Failed to fetch low stock products");
        }
        const data = await response.json();
        setProducts(data.data);
        setFilteredProducts(data.data);
      } catch (error: any) {
        setError(error.message);
        console.error("Error fetching Low Stock Alerts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLowStockProducts();
  }, [state.isLoading, state.isAuthenticated, state.token, router]);

  //Apply filters and sorting
  useEffect(() => {
    let result = [...products];

    //Apply status filter
    if (statusFilter === "out") {
      result = result.filter((p) => p.stockStatus === "Out of Stock");
    } else if (statusFilter === "low") {
      result = result.filter((p) => p.stockStatus === "Low Stock");
    }

    //Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.warehouseName.toLowerCase().includes(term) ||
          p.categoryName.toLowerCase().includes(term) ||
          p.supplierName.toLowerCase().includes(term)
      );
    }

    //Apply sorting
    if (sortConfig.key !== "") {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof LowStockProduct];
        const bValue = b[sortConfig.key as keyof LowStockProduct];
        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    setFilteredProducts(result);
  }, [products, statusFilter, searchTerm, sortConfig]);

  //Handle sorting
  const handleSort = (key: keyof LowStockProduct) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
  };

  //Handle Clear
  const clearSearch = () => {
    setSearchTerm("");
  };

  //Get summary counts
  const outOfStockCount = products.filter(
    (p) => p.stockStatus === "Out of Stock"
  ).length;
  const lowStockCount = products.filter(
    (p) => p.stockStatus === "Low Stock"
  ).length;

  //DISPLAY SPINNER WHEN ISLOADING
  if (state.isLoading) {
    return <Spinner />;
  }

  //DISPLAY ERROR MESSAGE
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md w-full max-w-md mx-auto relative"
          role="alert"
        >
          <strong className="font-bold text-lg">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
          <button
            className="absolute top-2 right-2 text-red-500 hover:text-red-700 focus:outline-none"
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Low Stock Alerts
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Monitor products requiring attention
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          className={`rounded-lg p-4 border transition-all duration-200 cursor-pointer ${
            statusFilter === "all"
              ? "bg-blue-50 border-blue-300 shadow-md"
              : "bg-white border-gray-200 hover:bg-gray-50"
          }`}
          onClick={() => setStatusFilter("all")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-blue-600">
                All Products
              </p>
              <p className="text-lg sm:text-2xl font-bold text-blue-800">
                {products.length}
              </p>
            </div>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold">{products.length}</span>
            </div>
          </div>
        </div>

        <div
          className={`rounded-lg p-4 border transition-all duration-200 cursor-pointer ${
            statusFilter === "out"
              ? "bg-red-50 border-red-300 shadow-md"
              : "bg-white border-gray-200 hover:bg-gray-50"
          }`}
          onClick={() => setStatusFilter("out")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-red-600">
                Out of Stock
              </p>
              <p className="text-lg sm:text-2xl font-bold text-red-800">
                {outOfStockCount}
              </p>
            </div>
            <AlertOctagon className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
          </div>
        </div>

        <div
          className={`rounded-lg p-4 border transition-all duration-200 cursor-pointer ${
            statusFilter === "low"
              ? "bg-yellow-50 border-yellow-300 shadow-md"
              : "bg-white border-gray-200 hover:bg-gray-50"
          }`}
          onClick={() => setStatusFilter("low")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-yellow-600">
                Low Stock
              </p>
              <p className="text-lg sm:text-2xl font-bold text-yellow-800">
                {lowStockCount}
              </p>
            </div>
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
          </div>
        </div>

        <div className="rounded-lg p-4 border bg-white border-gray-200 relative">
          <div className="flex flex-col h-full">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">
              Search Products
            </p>
            <div className="relative mt-auto">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full p-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Table/Cards */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        {/* Mobile View - Card Layout */}
        <div className="block md:hidden">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <Spinner />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No products match your filters
            </div>
          ) : (
            filteredProducts.map((product, index) => (
              <div
                key={index}
                className={`p-4 border-b border-gray-200 ${
                  product.stockStatus === "Out of Stock"
                    ? "bg-red-50"
                    : "bg-yellow-50"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      {product.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      ${product.price.toFixed(2)}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      product.stockStatus === "Out of Stock"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {product.stockStatus}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Warehouse:</span>
                    <span className="text-gray-900 font-medium">
                      {product.warehouseName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category:</span>
                    <span className="text-gray-900">
                      {product.categoryName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Supplier:</span>
                    <span className="text-gray-900">
                      {product.supplierName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quantity:</span>
                    <span
                      className={`font-medium ${
                        product.stockStatus === "Out of Stock"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {product.quantity}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop/Tablet View - Table Layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Product</span>
                    {sortConfig.key === "name" && (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("warehouseName")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Warehouse</span>
                    {sortConfig.key === "warehouseName" && (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("categoryName")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Category</span>
                    {sortConfig.key === "categoryName" && (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("supplierName")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Supplier</span>
                    {sortConfig.key === "supplierName" && (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("quantity")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Quantity</span>
                    {sortConfig.key === "quantity" && (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("stockStatus")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {sortConfig.key === "stockStatus" && (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <Spinner />
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No products match your filters
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, index) => (
                  <tr
                    key={index}
                    className={`hover:bg-gray-50 ${
                      product.stockStatus === "Out of Stock" ? "bg-red-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-start">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ${product.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.warehouseName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.categoryName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.supplierName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span
                        className={
                          product.stockStatus === "Out of Stock"
                            ? "text-red-600 font-medium"
                            : "text-yellow-600 font-medium"
                        }
                      >
                        {product.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          product.stockStatus === "Out of Stock"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {product.stockStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {isLoading ? (
          <Spinner />
        ) : (
          products.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No low stock products found
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default LowStockAlertsPage;
