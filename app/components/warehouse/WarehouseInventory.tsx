"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { InventoryDetails } from "@/app/types/warehouse";

//LOGIC TO DISPLAY WAREHOUSE INVENTORY DETAILS
export default function WarehouseInventory() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [inventoryData, setInventoryData] = useState<InventoryDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  //Get id from useParams instead of props
  const params = useParams();
  const id = params?.id as string;

  //HANDLE SUBMIT LOGIC
  const fetchInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }
    setLoading(true);
    try {
      //Use query parameters instead of body for GET request
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
      }).toString();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/warehouses/${id}/inventory?${queryParams}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) {
        throw new Error("Failed to fetch inventory data.");
      }
      const data = await res.json();
      setInventoryData(data);
      setError("");
    } catch (error) {
      console.error("Fetch error:", error);
      setError("An error occurred while fetching inventory.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Warehouse Inventory</h2>
      <form onSubmit={fetchInventory}>
        <div className="mb-4">
          <label className="block text-gray-700">Start Date</label>
          <input
            type="date"
            className="w-full p-2 border border-gray-300 rounded"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">End Date</label>
          <input
            type="date"
            className="w-full p-2 border border-gray-300 rounded"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded"
          disabled={loading}
        >
          {loading ? "Fetching..." : "Fetch Inventory"}
        </button>

        {error && <p className="text-red-500 mt-2">{error}</p>}

        {inventoryData && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold">Inventory Data</h3>
            <div className="border border-gray-300 p-4 rounded mt-2">
              <p className="font-semibold">Opening Stock:</p>
              <p>Quantity: {inventoryData.openingStock.quantity}</p>
              <p>Value: ${inventoryData.openingStock.value.toFixed(2)}</p>

              <p className="font-semibold mt-4">Inflow:</p>
              <p>Quantity: {inventoryData.inflow.quantity}</p>
              <p>Value: ${inventoryData.inflow.value.toFixed(2)}</p>

              <p className="font-semibold mt-4">Outflow:</p>
              <p>Quantity: {inventoryData.outflow.quantity}</p>
              <p>Value: ${inventoryData.outflow.value.toFixed(2)}</p>

              <p className="font-semibold mt-4">Closing Stock:</p>
              <p>Quantity: {inventoryData.closingStock.quantity}</p>
              <p>Value: ${inventoryData.closingStock.value.toFixed(2)}</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}