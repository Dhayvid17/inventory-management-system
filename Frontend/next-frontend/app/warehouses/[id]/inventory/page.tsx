"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { InventoryDetails } from "@/app/types/warehouse";
import Spinner from "@/app/components/Spinner";
import { useAuthContext } from "@/app/hooks/useAuthContext";

//LOGIC TO DISPLAY WAREHOUSE INVENTORY DETAILS
export default function WarehouseInventory() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [inventoryData, setInventoryData] = useState<InventoryDetails | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const router = useRouter();

  const { state } = useAuthContext();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";

  //Get id from useParams instead of props
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/users/login"); //Redirect to login if not authenticated
      return;
    }
    if (!isStaffAdmin) {
      setError("You are not authorized to view warehouse details.");
    }
  }, [state.isAuthenticated, isStaffAdmin, router]);

  //HANDLE SUBMIT LOGIC
  const fetchInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/warehouses/${id}/inventory`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.token}`,
          },
          body: JSON.stringify({ startDate, endDate }),
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

  //LOGIC TO DISPLAY SPINNER WHEN ISLOADING IS TRUE
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

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
            You are not authorized to fetch warehouse Inventory.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-5">Warehouse Inventory</h2>
      <form
        onSubmit={fetchInventory}
        className=" max-w-md border rounded bg-white p-6"
      >
        <div className="mb-4">
          <label className="block text-gray-700">Start Date</label>
          <input
            type="date"
            className="w-full p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">End Date</label>
          <input
            type="date"
            className="w-full p-2 border border-gray-300 rounded mt-1 focus:border-2 focus:border-green-700 outline-none cursor-pointer"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white my-3 p-2 rounded hover:bg-blue-600 transition"
          disabled={loading}
        >
          {loading ? "Fetching..." : "Fetch Inventory"}
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      {inventoryData && (
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
            Inventory Data
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Opening Stock Card */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 cursor-pointer">
              <h4 className="text-lg font-semibold text-blue-800 mb-3">
                Opening Stock
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium text-gray-800">
                    {inventoryData.openingStock.quantity}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Value:</span>
                  <span className="font-medium text-gray-800">
                    💲{inventoryData.openingStock.value.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Inflow Card */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-100 cursor-pointer">
              <h4 className="text-lg font-semibold text-green-800 mb-3">
                Inflow
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium text-gray-800">
                    {inventoryData.inflow.quantity}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Value:</span>
                  <span className="font-medium text-gray-800">
                    💲{inventoryData.inflow.value.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Outflow Card */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-100 cursor-pointer">
              <h4 className="text-lg font-semibold text-red-800 mb-3">
                Outflow
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium text-gray-800">
                    {inventoryData.outflow.quantity}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Value:</span>
                  <span className="font-medium text-gray-800">
                    💲{inventoryData.outflow.value.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Closing Stock Card */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100 cursor-pointer">
              <h4 className="text-lg font-semibold text-purple-800 mb-3">
                Closing Stock
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium text-gray-800">
                    {inventoryData.closingStock.quantity}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Value:</span>
                  <span className="font-medium text-gray-800">
                    💲{inventoryData.closingStock.value.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
