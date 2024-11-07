import Link from "next/link";
import React, { Suspense } from "react";
import Spinner from "../components/Spinner";
import StaffAssignmentList from "../components/staff-assignment/StaffAssignmentList";

//LOGIC TO FETCH STAFF ASSIGNMENTS FROM BACKEND SERVER
const fetchStaffAssignments = async () => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/staff-assignments`,
    {
      next: {
        revalidate: 0,
      },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch staff assignments");
  const data = res.json();
  return data;
};

//LOGIC TO DISPLAY THE STAFF ASSIGNMENT PAGE
const StaffAssignmentPage: React.FC = async () => {
  const staffAssignments = await fetchStaffAssignments();
  return (
    <div>
      <main className="p-8 bg-gray-100 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">All Assigned Staffs</h1>
          <Link
            href="/staff-assignments/create"
            className="bg-blue-600 text-white font-medium border border-blue-600 hover:bg-blue-950 transition duration-200 ease-in-out px-4 py-2 rounded"
          >
            Add New Staff
          </Link>
        </div>
        <Suspense fallback={<Spinner />}>
          <StaffAssignmentList staffAssignments={staffAssignments} />
        </Suspense>
      </main>
    </div>
  );
};

export default StaffAssignmentPage;
