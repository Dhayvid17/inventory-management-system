import React from "react";
import Link from "next/link";
import { IStaffAssignment } from "@/app/types/staffAssignment";

interface StaffAssignmentListProps {
  staffAssignments: IStaffAssignment[];
}

//LOGIC TO LIST CATEGORIES
const StaffAssignmentList: React.FC<StaffAssignmentListProps> = ({
  staffAssignments,
}) => (
  <ul className="space-y-4">
    {staffAssignments.map((staffAssignment) => (
      <li key={staffAssignment._id} className="p-4 border-b border-gray-400">
        <Link
          href={`/staff-assignments/${staffAssignment._id}`}
          className="text-lg font-medium text-blue-600 hover:text-blue-950"
        >
          {staffAssignment.staffId?.username}
        </Link>
      </li>
    ))}
    {staffAssignments.length === 0 && (
      <li className="p-4 text-gray-500 text-center">No results found</li>
    )}
  </ul>
);

export default StaffAssignmentList;
