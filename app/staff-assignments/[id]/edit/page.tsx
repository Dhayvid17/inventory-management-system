"use client";

import {
  IStaffAssignment,
  StaffAssignmentEditFormProps,
  User,
} from "@/app/types/staffassignment";
import { Warehouse } from "@/app/types/warehouse";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

//LOGIC TO EDIT EXISTING STAFF ASSIGNMENT DATA
const StaffAssignmentEditForm: React.FC<StaffAssignmentEditFormProps> = ({
  staffAssignment,
}) => {
  const router = useRouter();
  const params = useParams();
  const [staffUsername, setStaffUsername] = useState("");
  const [staffUsernames, setStaffUsernames] = useState<User[]>([]);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const id = params.id;

  //Fetch initial options for staff and admin users
  useEffect(() => {
    const fetchData = async () => {
      await fetchStaffUsernames();
      await fetchWarehouses();
    };
    fetchData();
  }, [id]);

  const fetchStaffUsernames = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/staff-admin`
      );
      const data = await res.json();
      setStaffUsernames(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Error fetching users");
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses`);
      const data = await res.json();
      setWarehouses(data);
    } catch (error) {
      console.error(error);
      setError("Error fetching warehouses");
    }
  };

  //HANDLE SUBMIT LOGIC
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate fields
    if (!staffUsername || !warehouse) {
      setError("Please fill in all fields");
      return;
    }

    //Check if the staff is already assigned to the selected warehouse
    const staffExists = warehouse.managedBy?.some(
      (staff) => staff._id.toString() === staffUsername
    );
    if (staffExists) {
      setError("Staff is already assigned to this warehouse");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/staff-assignments/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            staffId: staffUsername,
            warehouseId: warehouse._id,
          }),
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Server response error:", errorData);
        throw new Error(
          errorData.message || "Failed to add staff" || `Error: ${res.status}`
        );
      }
      router.push("/staff-assignments");
      router.refresh();
    } catch (error) {
      console.error("Fetch error:", error);
      setError("An error occurred while adding new staff.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 shadow rounded-lg max-w-md"
    >
      {/* Alert Box for Errors */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => setError("")}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <svg
              className="fill-current h-6 w-6 text-red-500"
              role="button"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <title>Close</title>
              <path d="M14.348 5.652a1 1 0 00-1.414 0L10 8.586 7.066 5.652a1 1 0 10-1.414 1.414l2.934 2.934-2.934 2.934a1 1 0 101.414 1.414L10 12.414l2.934 2.934a1 1 0 001.414-1.414l-2.934-2.934 2.934-2.934a1 1 0 000-1.414z" />
            </svg>
          </button>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-gray-700">Staff Username</label>
        <select
          className="w-full p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
          value={staffUsername}
          onChange={(e) => setStaffUsername(e.target.value)}
        >
          <option value="" className="text-gray-700">
            Select a Staff
          </option>
          {staffUsernames.map((staff) => (
            <option key={staff._id} value={staff._id}>
              {staff.username}
            </option>
          ))}
        </select>
      </div>

      {/* Autocomplete Dropdown for Warehouse */}
      <div className="mb-4 relative">
        <label className="block text-gray-700">Warehouse</label>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
          placeholder="Search warehouse"
          value={warehouseSearch}
          onChange={(e) => {
            setWarehouseSearch(e.target.value);
            setWarehouse(null);
          }}
        />
        {warehouseSearch.trim() && !warehouse && warehouses.length > 0 && (
          <ul className="absolute w-full bg-white border border-gray-300 mt-1 max-h-40 overflow-y-auto z-10">
            {warehouses
              .filter((ware) =>
                ware.name
                  .toLowerCase()
                  .includes(warehouseSearch.toLowerCase().trim())
              )
              .map((ware) => (
                <li
                  key={ware._id}
                  onClick={() => {
                    setWarehouse(ware);
                    setWarehouseSearch(ware.name);
                  }}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                >
                  {ware.name}
                </li>
              ))}
          </ul>
        )}
      </div>

      <button
        type="submit"
        className={`w-full bg-blue-500 text-white p-2 rounded mt-4 hover:bg-blue-700 transition-colors ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabled={loading}
      >
        {loading ? "Re-Assigning..." : "Re-Assign Staff To Warehouse"}
      </button>
    </form>
  );
};

export default StaffAssignmentEditForm;
