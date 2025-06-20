"use client";

import React, { Suspense, useEffect, useState } from "react";
import Spinner from "../components/Spinner";
import Link from "next/link";
import ProductList from "../components/product/ProductList";
import { useAuthContext } from "../hooks/useAuthContext";
import { useRouter } from "next/navigation";

//LOGIC TO DISPLAY ALL PRODUCTS
const ProductPage: React.FC = () => {
  const [products, setProducts] = useState<[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);

  const { state } = useAuthContext();
  const router = useRouter();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";

  useEffect(() => {
    if (state.isLoading) return; //Wait until loading is false

    if (!state.isAuthenticated) {
      router.push("/users/login"); //Redirect to login if not authenticated
      return;
    }
    //Fetch products from Backend API
    const fetchProducts = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/products?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`,
          {
            headers: {
              Authorization: `Bearer ${state.token}`,
            },
          }
        );
        if (!res.ok) {
          if (res.status === 401) {
            //Token might be invalid/expired
            router.push("/users/login");
            return;
          }
          throw new Error(`Failed to fetch products: ${res.statusText}`);
        }
        const data = await res.json();
        setProducts(data.products);
        setTotalPages(data.pagination.totalPages);
      } catch (error: any) {
        setError(error.message);
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    //Add debounce for search
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    state.isLoading,
    state.isAuthenticated,
    state.token,
    router,
    currentPage,
    itemsPerPage,
    searchTerm,
  ]);

  //Display Spinner when IsLoading
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
    <main className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header and Search Section */}
        <div className="mb-6">
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Products</h1>

          {/* Search and Button Container */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:items-center sm:gap-4">
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-green-700 text-sm outline-none cursor-pointer"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Create Button */}
            {isStaffAdmin && (
              <Link
                href="/products/create"
                className="bg-blue-600 text-white font-medium border border-blue-600 hover:bg-blue-950 transition duration-200 ease-in-out px-4 py-2 rounded-lg text-center sm:whitespace-nowrap"
              >
                Create New Product
              </Link>
            )}
          </div>
        </div>

        {/* Product List */}
        {isLoading ? (
          <Spinner />
        ) : products.length > 0 ? (
          <>
            <ProductList products={products} />

            {/* Pagination Controls */}
            <div className="mt-6 flex justify-between items-center flex-col sm:flex-row gap-4">
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded-md hover:bg-blue-600 hover:text-white disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "border hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded-md hover:bg-blue-600 hover:text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Items per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border rounded-md px-2 py-1 focus:border-green-700 outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500 mt-4 text-lg font-semibold">
            No products available.
          </p>
        )}
      </div>
    </main>
  );
};

export default ProductPage;
