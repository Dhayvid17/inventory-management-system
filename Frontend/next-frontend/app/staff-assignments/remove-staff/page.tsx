"use client";

import Spinner from "@/app/components/Spinner";
import { useAuthContext } from "@/app/hooks/useAuthContext";
import { IStaffAssignment, User } from "@/app/types/staffAssignment";
import { Warehouse } from "@/app/types/warehouse";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const StaffAssignmentRemoveForm: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const [staffUsername, setStaffUsername] = useState("");
  const [staffUsernames, setStaffUsernames] = useState<User[]>([]);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false); //Add this to track auth check
  const { state } = useAuthContext();

  const isAdmin = state.user?.role === "admin";
  const id = params.id;

  //Fetch initial options for staff and admin users
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
      setLoading(false); //No longer loading
      setError("You are not authorized to staff Assignment.");
      router.push("/unauthorized"); //Redirect to 403 page if not admin
      return;
    }
    const fetchData = async () => {
      try {
        //Fetch staff and warehouses first
        const [staffData, warehouseData] = await Promise.all([
          fetchStaffUsernames(state.token || ""),
          fetchWarehouses(state.token || ""),
        ]);

        //Save fetched options to state
        setStaffUsernames(staffData);
        setWarehouses(warehouseData);

        //If we have an ID, fetch the current assignment
        if (id) {
          const currentAssignment = await fetchCurrentAssignment(
            id as string,
            state.token || ""
          );

          if (
            currentAssignment &&
            currentAssignment.staffId &&
            currentAssignment.warehouseId
          ) {
            //Match the Staff from the StaffData
            const staffMatch: User | undefined = staffData.find(
              (staff: User) => staff._id === currentAssignment.staffId._id
            );
            if (staffMatch) {
              setStaffUsername(staffMatch._id);
            }
            //Match the Warehouse from the WarehouseData
            const warehouseMatch: Warehouse | undefined = warehouseData.find(
              (warehouse: Warehouse) =>
                warehouse._id === currentAssignment.warehouseId._id
            );
            if (warehouseMatch) {
              setWarehouse(warehouseMatch);
              setWarehouseSearch(warehouseMatch.name);
            }
          }
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        setError(`Error loading data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [state.isLoading, state.isAuthenticated, state.token, isAdmin, router]);

  //LOGIC TO CONNECT TO THE BACKEND SERVER
  const fetchStaffUsernames = async (token: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/staff-admin`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      setStaffUsernames(data);
      return data;
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setError(`Error fetching users: ${error.message}`);
    }
  };

  //LOGIC TO CONNECT TO THE BACKEND SERVER
  const fetchWarehouses = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setWarehouses(data);
      return data;
    } catch (error: any) {
      console.error(error);
      setError(`Error fetching warehouses: ${error.message}`);
    }
  };

  //LOGIC TO CONNECT TO THE BACKEND API TO FETCH THE STAFF ASSIGNMENTS
  const fetchCurrentAssignment = async (id: string, token: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/staff-assignments/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        throw new Error("Failed to fetch current assignment details");
      }
      const data = await res.json();
      return data;
    } catch (error: any) {
      console.error("Error fetching staff assignment:", error);
      setError(`Error fetching staff assignment: ${error.message}`);
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

    //Check if the staff is not assigned to the selected warehouse
    const staffExists = warehouse.managedBy?.some(
      (staff) => staff._id.toString() === staffUsername
    );
    if (!staffExists) {
      setError("Staff is not assigned to this warehouse");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/staff-assignment/remove-staff`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
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
          errorData.message ||
            "Failed to remove staff" ||
            `Error: ${res.status}`
        );
      }
      router.push("/staff-assignments");
      router.refresh();
    } catch (error: any) {
      console.error("Fetch error:", error);
      setError(`An error occurred while adding new staff: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  //LOGIC TO DISPLAY SPINNER WHEN ISLOADING IS TRUE
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  //DISPLAY ERROR MESSAGE IF THE USER IS NOT STAFF/ADMIN
  if (authChecked && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md mx-auto"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">
            You are not authorized to edit staff Assignment.
          </span>
        </div>
      </div>
    );
  }

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
        {loading ? "Removing..." : "Remove Staff From Warehouse"}
      </button>
    </form>
  );
};

export default StaffAssignmentRemoveForm;
