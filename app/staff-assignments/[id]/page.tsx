"use client";

import Spinner from "@/app/components/Spinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import NotFound from "../not-found";
import { IStaffAssignment } from "@/app/types/staffassignment";

interface StaffAssignmentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

//LOGIC TO GET THE CATEGORY DETAILS FROM THE BACKEND SERVER
async function getStaffAssignmentDetail(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/staff-assignments/${id}`,
    {
      next: {
        revalidate: 60,
      },
    }
  );
  if (!res.ok) {
    return null;
  }
  const data = res.json();
  return data;
}

//LOGIC TO DISPLAY EACH STAFF ASSIGNMENT PAGE
export default function StaffAssignmentDetailPage({
  params,
}: StaffAssignmentDetailPageProps) {
  const [staffAssignment, setStaffAssignment] =
    useState<IStaffAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  //Unwrap params using React.use()
  const { id } = React.use(params);

  useEffect(() => {
    const fetchStaffAssignment = async () => {
      try {
        const data = await getStaffAssignmentDetail(id);
        setStaffAssignment(data);
      } catch (error) {
        setStaffAssignment(null);
        console.error("Error fetching staff assignment:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaffAssignment();
  }, [id]);

  //HANDLE DELETE LOGIC
  const handleDelete = async () => {
    if (
      confirm("Are you sure you want to delete this staff assignment details?")
    ) {
      setIsDeleting(true);
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/staff-assignments/${id}`,
          {
            method: "DELETE",
          }
        );
        alert("Staff assignment details deleted successfully!");
        router.push("/staff-assignments");
        router.refresh();
      } catch (error) {
        console.error("Error deleting staff assignment:", error);
        alert("Error deleting staff assignment");
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

  //LOGIC TO DISPLAY NOT-FOUND IS CATEGORY DATA RETURN NULL
  if (!staffAssignment) {
    return <NotFound />;
  }
  return (
    <div className="p-6 sm:p-8 bg-gray-100 min-h-screen flex justify-center">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">
            Assignment Details
          </h2>
          <div className="flex space-x-2">
            <Link href={`/staff-assignments/${id}/edit`}>
              <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition">
                Re-Assign Staff
              </button>
            </Link>
            <Link href={`/staff-assignments/remove-staff`}>
              <button className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded transition">
                Remove Staff
              </button>
            </Link>
            <Link href={`/staff-assignments/terminate-staff`}>
              <button className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition">
                Terminate Staff
              </button>
            </Link>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
          <p className="text-lg text-gray-600 mb-2">
            <strong>Staff Username:</strong> {staffAssignment.staffId.username}
          </p>
          <p className="text-lg text-gray-600 mb-2">
            <strong>Warehouse Name:</strong>{" "}
            {staffAssignment.warehouseId?.name || "N/A"}
          </p>
          <p className="text-lg text-gray-600 mb-2">
            <strong>Warehouse Location:</strong>{" "}
            {staffAssignment.warehouseId?.location || "N/A"}
          </p>
          <p className="text-lg text-gray-600 mb-2">
            <strong>Warehouse Capacity:</strong>{" "}
            {staffAssignment.warehouseId?.capacity || "N/A"}
          </p>
          <p className="text-lg text-gray-600 mb-2">
            <strong>Employment Date:</strong>{" "}
            {staffAssignment.employmentDate
              ? new Date(staffAssignment.employmentDate).toLocaleDateString()
              : "N/A"}
          </p>
          <p className="text-lg text-gray-600 mb-2">
            <strong>Termination Date:</strong>{" "}
            {staffAssignment.terminationDate
              ? new Date(staffAssignment.terminationDate).toLocaleDateString()
              : "N/A"}
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleDelete}
            className={`bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition ${
              isDeleting ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}
