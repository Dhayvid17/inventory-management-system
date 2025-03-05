"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "../hooks/useAuthContext";
import { useRouter } from "next/navigation";
import Spinner from "../components/Spinner";
import Link from "next/link";
import TransferRequestList from "../components/transfer-request/TransferRequestList";

//LOGIC TO DISPLAY THE TRANSFER REQUEST PAGE
const TransferRequestPage: React.FC = () => {
  const [transferRequests, setTransferRequests] = useState<[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    if (!isStaffAdmin) {
      router.push("/unauthorized"); //Redirect to 403 if not staff admin
    }
    //Fetch transfer requests from Backend API
    const fetchTransfers = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/transfer-request`,
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
          throw new Error(
            `Failed to fetch transfer requests: ${res.statusText}`
          );
        }
        const data = await res.json();
        console.log(data);
        setTransferRequests(data);
      } catch (error: any) {
        setError(error.message);
        console.error("Error fetching transfer requests:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransfers();
  }, [
    state.isLoading,
    state.isAuthenticated,
    isStaffAdmin,
    state.token,
    router,
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
    <div className="container mx-auto p-4">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-2 sm:gap-0">
        <h1 className="text-2xl font-semibold mb-4">
          Transfer Request Details
        </h1>
        {isStaffAdmin && (
          <Link
            href="/transfer-request/create"
            className="bg-blue-600 text-white font-medium border border-blue-600 hover:bg-blue-950 transition duration-200 ease-in-out rounded px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-base"
          >
            Create New Transfer Request
          </Link>
        )}
      </div>
      {isLoading ? (
        <Spinner />
      ) : transferRequests.length > 0 ? (
        <TransferRequestList transferRequests={transferRequests} />
      ) : (
        <p className="text-center text-gray-500 mt-4 text-lg font-semibold">
          No Transfer Requests available.
        </p>
      )}
    </div>
  );
};

export default TransferRequestPage;
