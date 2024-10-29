import React, { Suspense } from "react";
import Spinner from "../components/Spinner";
import Link from "next/link";
import WarehouseList from "../components/warehouse/WarehouseList";

//LOGIC TO FETCH WAREHOUSES FROM BACKEND SERVER
const fetchWarehouses = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses`, {
    next: {
      revalidate: 0,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch warehouses");
  const data = await res.json();
  return data;
};

//LOGIC TO DISPLAY ALL WAREHOUSES
const WarehousesPage: React.FC = async () => {
  const warehouses = await fetchWarehouses();

  return (
    <main className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Warehouses</h1>
        <Link
          href="/warehouses/create"
          className="bg-blue-600 text-white font-medium border border-blue-600 hover:bg-blue-950 transition duration-200 ease-in-out px-4 py-2 rounded"
        >
          Add New Warehouse
        </Link>
      </div>
      <Suspense fallback={<Spinner />}>
        <WarehouseList warehouses={warehouses} />
      </Suspense>
    </main>
  );
};

export default WarehousesPage;
