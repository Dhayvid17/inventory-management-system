"use client";

import React, { Suspense, useEffect, useState } from "react";
import Spinner from "../components/Spinner";
import InventoryTransactionList from "../components/inventory-transaction/InventoryTransactionList";
import { InventoryTransaction } from "@/app/types/inventoryTransaction";
import { useAuthContext } from "../hooks/useAuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

//LOGIC TO DISPLAY THE INVENTORY TRANSACTION PAGE
const InventoryTransactionPage: React.FC = () => {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { state, dispatch } = useAuthContext();
  const router = useRouter();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";

  const transactionTypes = [
    "Restock Transaction",
    "Sales Transaction",
    "Damaged Product",
    "Supplier Return",
    "Customer Return",
    "Inter-Warehouse Transfer",
    "Addition/Removal of Product From Warehouse",
    "Failed Transfer Request",
  ];

  //Filter transactions based on search term
  const filteredTransactions = transactions.filter((transaction) =>
    transaction.transactionType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (state.isLoading) return; //Wait until loading is false

    if (!state.isAuthenticated) {
      router.push("/users/login"); //Redirect to login if not authenticated
      return;
    }

    if (!isStaffAdmin) {
      router.push("/unauthorized"); //redirect to a 403 Forbidden page or handle as needed
      return;
    }

    //Fetch Inventory transactions from Backend API with Pagination
    const fetchInventories = async (page: number) => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/inventory-transactions?page=${page}&limit=${itemsPerPage}`,
          {
            headers: {
              Authorization: `Bearer ${state.token}`,
            },
            next: {
              revalidate: 0,
            },
          }
        );
        if (!res.ok) {
          if (res.status === 401) {
            //Token might be invalid/expired
            router.push("/users/login");
            return;
          }
          throw new Error(`Failed to fetch Transactions: ${res.statusText}`);
        }
        const data = await res.json();
        setTransactions(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
      } catch (error: any) {
        setError(error.message);
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventories(currentPage);
  }, [
    currentPage,
    itemsPerPage,
    state.isLoading,
    state.isAuthenticated,
    isStaffAdmin,
    state.token,
    router,
  ]);

  //Handle Page Change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  //LOGIC TO DISPLAY SPINNER WHEN ISLOADING IS TRUE
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  //DISPLAY ERROR MESSAGE
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md mx-auto"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg
              className="fill-current h-6 w-6 text-red-500"
              role="button"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <title>Close</title>
              <path d="M14.348 5.652a1 1 0 00-1.414 0L10 8.586 7.066 5.652a1 1 0 10-1.414 1.414L8.586 10l-2.934 2.934a1 1 0 101.414 1.414L10 11.414l2.934 2.934a1 1 0 001.414-1.414L11.414 10l2.934-2.934a1 1 0 000-1.414z" />
            </svg>
          </span>
        </div>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Inventory Transactions</h1>
            <p className="text-gray-600 mt-1">
              Manage and organize your transactions
            </p>
          </div>
          {isStaffAdmin && (
            <Link
              href="/inventory-transactions/create"
              className="bg-blue-600 text-white font-medium border border-blue-600 hover:bg-blue-950 transition duration-200 ease-in-out rounded px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-base"
            >
              Record New Transaction
            </Link>
          )}
        </div>

        {/* Search and Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search transaction types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:border-green-700 text-sm outline-none cursor-pointer"
              />
            </div>

            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Show:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="border border-gray-300 rounded-lg text-sm p-2 focus:border-green-700 outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Transaction Type Suggestions */}
          {searchTerm && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-2">
                {transactionTypes
                  .filter((type) =>
                    type.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((type, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchTerm(type)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full"
                    >
                      {type}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Transactions List */}
        {isLoading ? (
          <Spinner />
        ) : filteredTransactions.length > 0 ? (
          <Suspense fallback={<Spinner />}>
            <InventoryTransactionList transactions={filteredTransactions} />
          </Suspense>
        ) : (
          <div className="text-center py-8 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 text-lg">
              No matching transactions found.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              -{" "}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, totalItems)}
              </span>{" "}
              of <span className="font-medium">{totalItems}</span> results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default InventoryTransactionPage;
