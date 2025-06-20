"use client";

import Spinner from "@/app/components/Spinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import NotFound from "../not-found";
import { IStaffAssignment } from "@/app/types/staffAssignment";
import { useAuthContext } from "@/app/hooks/useAuthContext";

interface StaffAssignmentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

//LOGIC TO GET THE CATEGORY DETAILS FROM THE BACKEND SERVER
async function getStaffAssignmentDetail(id: string, token: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/staff-assignments/${id}`,
    {
      method: "GET",
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
    throw new Error(`Failed to fetch staff Assignment: ${res.statusText}`);
  }
  const data = await res.json();
  return data;
}

//LOGIC TO DISPLAY EACH STAFF ASSIGNMENT PAGE
export default function StaffAssignmentDetailPage({
  params,
}: StaffAssignmentDetailPageProps) {
  const [staffAssignment, setStaffAssignment] =
    useState<IStaffAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false); //Add this to track auth check
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { state } = useAuthContext();
  const router = useRouter();

  const isAdmin = state.user?.role === "admin";
  //Unwrap params using React.use()
  const { id } = React.use(params);

  useEffect(() => {
    //Wait for authentication state to be ready
    if (state.isLoading) {
      return;
    }

    if (!state.isAuthenticated) {
      router.push("/users/login"); //Redirect to login if not authenticated
      return;
    }
    //Mark auth as checked after we've verified the user status
    setAuthChecked(true);

    if (!isAdmin) {
      setIsLoading(false); //No longer loading
      setError("You are not authorized to view this page.");
      router.push("/unauthorized"); //Redirect to 403 page if not admin
    }

    //Fetch staffAssignment from Backend API
    const fetchStaffAssignment = async () => {
      try {
        const data = await getStaffAssignmentDetail(id, state.token || "");
        setStaffAssignment(data);
      } catch (error: any) {
        setStaffAssignment(null);
        setError(error.message);
        console.error("Error fetching staff assignment:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaffAssignment();
  }, [
    id,
    state.isLoading,
    state.isAuthenticated,
    isAdmin,
    state.token,
    router,
  ]);

  //HANDLE DELETE LOGIC
  const handleDelete = async () => {
    if (
      confirm("Are you sure you want to delete this staff assignment details?")
    ) {
      setIsDeleting(true);
      if (!isAdmin) {
        setError("You are not authorized to delete category");
        return;
      }
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/staff-assignments/${id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${state.token}`,
            },
          }
        );
        alert("Staff assignment details deleted successfully!");
        router.push("/staff-assignments");
        router.refresh();
      } catch (error: any) {
        console.error("Error deleting staff assignment:", error);
        alert(`Error deleting staff assignment: ${error.message}`);
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
  if (!staffAssignment) {
    return <NotFound />;
  }
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen flex justify-center">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 space-y-4 sm:space-y-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            Assignment Details
          </h2>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Link
              href={`/staff-assignments/${id}/edit`}
              className="flex-1 sm:flex-none"
            >
              <button className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 sm:px-4 rounded text-sm sm:text-base transition">
                Re-Assign Staff
              </button>
            </Link>
            <Link
              href={`/staff-assignments/remove-staff`}
              className="flex-1 sm:flex-none"
            >
              <button className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-3 sm:px-4 rounded text-sm sm:text-base transition">
                Remove Staff
              </button>
            </Link>
            <Link
              href={`/staff-assignments/terminate-staff`}
              className="flex-1 sm:flex-none"
            >
              <button className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white py-2 px-3 sm:px-4 rounded text-sm sm:text-base transition">
                Terminate Staff
              </button>
            </Link>
          </div>
        </div>

        {/* Details Section */}
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg shadow-inner space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="text-sm sm:text-base text-gray-600">
              <span className="font-semibold">Staff Username:</span>
              <span className="ml-2">{staffAssignment.staffId.username}</span>
            </div>

            <div className="text-sm sm:text-base text-gray-600">
              <span className="font-semibold">Warehouse Name:</span>
              <span className="ml-2">
                {staffAssignment.warehouseId?.name || "N/A"}
              </span>
            </div>

            <div className="text-sm sm:text-base text-gray-600">
              <span className="font-semibold">Warehouse Location:</span>
              <span className="ml-2">
                {staffAssignment.warehouseId?.location || "N/A"}
              </span>
            </div>

            <div className="text-sm sm:text-base text-gray-600">
              <span className="font-semibold">Warehouse Capacity:</span>
              <span className="ml-2">
                {staffAssignment.warehouseId?.capacity || "N/A"}
              </span>
            </div>

            <div className="text-sm sm:text-base text-gray-600">
              <span className="font-semibold">Employment Date:</span>
              <span className="ml-2">
                {staffAssignment.employmentDate
                  ? new Date(
                      staffAssignment.employmentDate
                    ).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>

            <div className="text-sm sm:text-base text-gray-600">
              <span className="font-semibold">Termination Date:</span>
              <span className="ml-2">
                {staffAssignment.terminationDate
                  ? new Date(
                      staffAssignment.terminationDate
                    ).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-4 sm:mt-6 flex justify-end">
          <button
            onClick={handleDelete}
            className={`w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded text-sm sm:text-base transition
              ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}
