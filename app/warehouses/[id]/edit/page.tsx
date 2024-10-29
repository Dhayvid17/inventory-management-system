"use client";

import { Warehouse, WarehouseEditFormProps } from "@/app/types/warehouse";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

//LOGIC TO CONNECT TO THE BACKEND SERVER
const fetchWarehouseData = async (id: string): Promise<Warehouse> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/warehouses/${id}`,
    {
      next: {
        revalidate: 60,
      },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch warehouse");
  const data = res.json();
  return data;
};

//LOGIC TO EDIT EXISTING WAREHOUSE DATA
const WarehouseForm: React.FC<WarehouseEditFormProps> = ({ warehouse }) => {
  const router = useRouter();
  const params = useParams();
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState<number | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const id = params.id;

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const warehouse = await fetchWarehouseData(id as string);
        setName(warehouse.name);
        setType(warehouse.type);
        setLocation(warehouse.location);
        setCapacity(warehouse.capacity);
      } catch (error) {
        console.error("Failed to load warehouse data:", error);
      }
    };
    fetchWarehouses();
  }, [id]);

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
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/warehouses/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          location,
          capacity: capacityNumber,
        }),
      }
    );
    if (!res.ok) throw new Error("Failed to update warehouse");
    setLoading(false);
    router.push("/warehouses");
    router.refresh();
  };

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
