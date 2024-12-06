"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/app/hooks/useAuthContext";

//LOGIC TO ADD NEW WAREHOUSE FORM
const WarehouseForm: React.FC = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState<number | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { state } = useAuthContext();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/users/login"); //Redirect to login if not authenticated
      return;
    }
    if (!isStaffAdmin) {
      setError("You are not authorized to create a warehouse.");
    }
  }, [state.isAuthenticated, isStaffAdmin, router]);

  //HANDLE SUBMIT LOGIC
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    //Validate fields
    if (!name.trim() || !type.trim() || !location.trim() || capacity === "") {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          type: type.trim(),
          location: location.trim(),
          capacity: capacityNumber,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Server response error:", errorData);
        throw new Error(
          errorData.message ||
            "Failed to create warehouse" ||
            `Error: ${res.status}`
        );
      }

      router.push("/warehouses");
      router.refresh();
    } catch (error: any) {
      console.error("Fetch error:", error);
      setError(
        `An error occurred while creating the warehouse: ${error.message}.`
      );
    } finally {
      setLoading(false);
    }
  };

  //DISPLAY ERROR MESSAGE IF THE USER IS NOT STAFF/ADMIN
  if (!isStaffAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md mx-auto"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">
            You are not authorized to create warehouse.
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
          min={5000}
        />
        {capacity === "" && error && (
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
        {loading ? "Adding..." : "Create Warehouse"}
      </button>
    </form>
  );
};

export default WarehouseForm;
