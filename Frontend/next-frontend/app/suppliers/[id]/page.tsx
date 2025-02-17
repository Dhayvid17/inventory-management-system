"use client";

import Spinner from "@/app/components/Spinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Supplier } from "@/app/types/supplier";
import NotFound from "../not-found";
import { useAuthContext } from "@/app/hooks/useAuthContext";

interface SupplierDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

//LOGIC TO GET THE SUPPLIER DETAILS FROM THE BACKEND SERVER
async function getSupplierDetail(id: string, token: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/suppliers/${id}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      next: {
        revalidate: 60,
      },
    }
  );
  if (!res.ok) {
    throw new Error(`Network response to fetch supplier was not ok`);
  }
  const data = await res.json();
  return data;
}

//LOGIC TO DISPLAY EACH SUPPLIER DETAIL PAGE
export default function SupplierDetailPage({
  params,
}: SupplierDetailPageProps) {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { state } = useAuthContext();
  const router = useRouter();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";
  const isAdmin = state.user?.role === "admin";

  //Unwrap params using React.use()
  const { id } = React.use(params);

  useEffect(() => {
    const fetchSupplier = async () => {
      if (!state.isAuthenticated) {
        router.push("/users/login"); //Redirect to login if not authenticated
        return;
      }
      if (!isStaffAdmin) {
        setError("You are not authorized to fetch this page.");
        return;
      }
      try {
        const data = await getSupplierDetail(id, state.token || "");
        setSupplier(data);
      } catch (error: any) {
        setSupplier(null);
        setError(error.message);
        console.error("Error fetching category:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupplier();
  }, [id, state.isAuthenticated, isStaffAdmin, state.token, router]);

  //HANDLE DELETE LOGIC
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this category?")) {
      setIsDeleting(true);
      if (!isAdmin) {
        setError("You are not authorized to delete categories");
        return;
      }
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
        });
        alert("Supplier deleted successfully!");
        router.push("/suppliers");
        router.refresh();
      } catch (error: any) {
        setError(error.message);
        console.error("Error deleting supplier:", error);
        alert("Error deleting supplier");
      } finally {
        setIsDeleting(false);
      }
    }
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

  //LOGIC TO DISPLAY NOT-FOUND IS CATEGORY DATA RETURN NULL
  if (!supplier) {
    return <NotFound />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen flex flex-col">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-6 mb-4">
        {/* Supplier Information */}
        <div className="flex flex-col space-y-2 sm:space-y-3">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-bold">Supplier Name:</span>
            <span className="text-gray-800">{supplier.name}</span>
          </h1>

          <div className="text-sm sm:text-base lg:text-lg text-gray-700 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-bold">Supplier Contact:</span>
            <span>{supplier.contact}</span>
          </div>

          <div className="text-sm sm:text-base lg:text-lg text-gray-700 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-bold">Supplier Email:</span>
            <span>{supplier.email}</span>
          </div>

          <div className="text-sm sm:text-base lg:text-lg text-gray-700 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
            <span className="font-bold">Supplier Address:</span>
            <span className="sm:max-w-md">{supplier.address}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {isStaffAdmin && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-0">
            <Link
              href={`/suppliers/${id}/edit`}
              className="px-4 sm:px-6 py-2 bg-blue-500 text-white text-center rounded hover:bg-blue-600 transition-colors text-sm sm:text-base"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className={`px-4 sm:px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm sm:text-base
                ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
