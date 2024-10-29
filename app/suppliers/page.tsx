import React, { Suspense } from "react";
import Spinner from "../components/Spinner";
import Link from "next/link";
import SupplierList from "../components/supplier/SupplierList";

//LOGIC TO FETCH SUPPLIERS FROM BACKEND SERVER
const fetchSuppliers = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers`, {
    next: {
      revalidate: 0,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch suppliers");
  const data = await res.json();
  return data;
};

//LOGIC TO DISPLAY ALL SUPPLIERS
const SuppliersPage: React.FC = async () => {
  const suppliers = await fetchSuppliers();

  return (
    <main className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <Link
          href="/suppliers/create"
          className="bg-blue-600 text-white font-medium border border-blue-600 hover:bg-blue-950 transition duration-200 ease-in-out px-4 py-2 rounded"
        >
          Add New Supplier
        </Link>
      </div>
      <Suspense fallback={<Spinner />}>
        <SupplierList suppliers={suppliers} />
      </Suspense>
    </main>
  );
};

export default SuppliersPage;
