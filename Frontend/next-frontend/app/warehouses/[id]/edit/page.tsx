"use client";

import Spinner from "@/app/components/Spinner";
import { useAuthContext } from "@/app/hooks/useAuthContext";
import { Warehouse } from "@/app/types/warehouse";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

//LOGIC TO CONNECT TO THE BACKEND SERVER
const fetchWarehouseData = async (
  id: string,
  token: string
): Promise<Warehouse> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/warehouses/${id}`,
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
    throw new Error(`Failed to fetch warehouse: ${res.statusText}`);
  }
  const data = await res.json();
  return data;
};

//LOGIC TO EDIT EXISTING WAREHOUSE DATA
const WarehouseForm: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState<number | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false); //Add this to track auth check
  const { state } = useAuthContext();
  const id = params.id;

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";
  const isAdmin = state.user?.role === "admin";

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
      setError("You are not authorized to edit this warehouse.");
      router.push("/unauthorized"); //Redirect to unauthorized page
      return;
    }

    const fetchWarehouses = async () => {
      try {
        const warehouse = await fetchWarehouseData(
          id as string,
          state.token || ""
        );
        setName(warehouse.name);
        setType(warehouse.type);
        setLocation(warehouse.location);
        setCapacity(warehouse.capacity);
      } catch (error: any) {
        setError(error.message);
        console.error("Failed to load warehouse data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouses();
  }, [
    id,
    state.isLoading,
    state.isAuthenticated,
    state.token,
    isAdmin,
    router,
  ]);

  //HANDLE SUBMIT LOGIC
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !type || !location || !capacity) {
      setError("All fields are required.");
      return;
    }

    const capacityNumber =
      typeof capacity === "string" ? Number(capacity) : capacity;
    if (isNaN(capacityNumber) || capacityNumber < 0) {
      setError("Capacity must be a valid non-negative number.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/warehouses/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
          body: JSON.stringify({
            name,
            type,
            location,
            capacity: capacityNumber,
          }),
        }
      );
      if (!res.ok) {
        throw new Error(`Failed to update warehouse: ${res.statusText}`);
      }
      router.push("/warehouses");
      router.refresh();
    } catch (error: any) {
      setError(`Failed to update warehouse: ${error.message}`);
      console.error("Error updating warehouse:", error);
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
            You are not authorized to edit this warehouse.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Edit Warehouse</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 shadow rounded-lg max-w-md"
      >
        <div className="mb-4">
          <label className="block text-gray-700">Name</label>
          <input
            type="text"
            className="w-full text-blue-950 p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {!name && error && (
            <p className="text-red-500 text-sm">This field is required.</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Type</label>
          <select
            className="w-full text-blue-950 p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Select a type</option>
            <option value="regularWarehouse">Regular Warehouse</option>
            <option value="superWarehouse">Super Warehouse</option>
          </select>
          {!type && error && (
            <p className="text-red-500 text-sm">This field is required.</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Location</label>
          <input
            type="text"
            className="w-full text-blue-950 p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          {!location && error && (
            <p className="text-red-500 text-sm">This field is required.</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Capacity</label>
          <input
            type="number"
            className="w-full text-blue-950 p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
          {!capacity && error && (
            <p className="text-red-500 text-sm">This field is required.</p>
          )}
        </div>

        <button
          type="submit"
          className={`w-full bg-blue-500 text-white p-2 rounded mt-4 hover:bg-blue-700 transition-colors ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Warehouse"}
        </button>
      </form>
    </div>
  );
};

export default WarehouseForm;
