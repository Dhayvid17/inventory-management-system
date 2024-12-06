"use client";

import React, { Suspense, useEffect, useState } from "react";
import Spinner from "../components/Spinner";
import InventoryTransactionList from "../components/inventory-transaction/InventoryTransactionList";
import { useAuthContext } from "../hooks/useAuthContext";
import { useRouter } from "next/navigation";

//LOGIC TO DISPLAY THE INVENTORY TRANSACTION PAGE
const inventoryTransactionPage: React.FC = () => {
  const [transactions, setTransactions] = useState<[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { state, dispatch } = useAuthContext();
  const router = useRouter();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";

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

    //Fetch Inventory transactions from Backend API
    const fetchInventories = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/inventory-transactions`,
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
        setTransactions(data);
      } catch (error: any) {
        setError(error.message);
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventories();
  }, [
    state.isLoading,
    state.isAuthenticated,
    isStaffAdmin,
    state.token,
    router,
  ]);

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
    <div className="container">
      <h1 className="text-2xl font-bold m-4">Inventory Transactions</h1>
      <Suspense fallback={<Spinner />}>
        <InventoryTransactionList transactions={transactions} />
      </Suspense>
    </div>
  );
};

export default inventoryTransactionPage;
