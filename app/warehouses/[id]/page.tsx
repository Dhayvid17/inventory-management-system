"use client";

import Spinner from "@/app/components/Spinner";
import { Warehouse } from "@/app/types/warehouse";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import NotFound from "../not-found";

interface WarehouseDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

//LOGIC TO GET THE WAREHOUSE DETAILS FROM THE BACKEND SERVER
async function getWarehouseDetail(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/warehouses/${id}`,
    {
      next: {
        revalidate: 60,
      },
    }
  );
  if (!res.ok) {
    return null;
  }
  const data = res.json();
  return data;
}

//LOGIC TO DISPLAY EACH WAREHOUSE DETAIL PAGE
export default function WarehouseDetailPage({
  params,
}: WarehouseDetailPageProps) {
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  //Unwrap params using React.use()
  const { id } = React.use(params);

  useEffect(() => {
    const fetchWarehouse = async () => {
      try {
        const data = await getWarehouseDetail(id);
        setWarehouse(data);
      } catch (error) {
        setWarehouse(null);
        console.error("Error fetching warehouse:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWarehouse();
  }, [id]);

  //HANDLE DELETE LOGIC
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this warehouse?")) {
      setIsDeleting(true);
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses/${id}`, {
          method: "DELETE",
        });
        alert("Warehouse deleted successfully!");
        router.push("/warehouses");
        router.refresh();
      } catch (error) {
        console.error("Error deleting warehouse:", error);
        alert("Error deleting warehouse");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  //LOGIC TO DISPLAY SPINNER WHEN ISLOADING IS TRUE
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  //LOGIC TO DISPLAY NOT-FOUND IS WAREHOUSE DATA RETURN NULL
  if (!warehouse) {
    return <NotFound />;
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen flex flex-col">
      <div className="flex justify-between mb-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold mb-4">
            <strong>Warehouse Name: </strong>
            {warehouse.name}
          </h1>
          <span className="text-gray-700 text-lg mb-2">
            <strong>Warehouse Type: </strong>
            {warehouse.type}
          </span>
          <span className="text-gray-700 text-lg mb-2">
            <strong>Warehouse Location: </strong>
            {warehouse.location}
          </span>
          <span className="text-gray-700 text-lg mb-2">
            <strong>Warehouse Capacity: </strong>
            {warehouse.capacity}
          </span>
          <span className="text-gray-700 text-lg mb-2">
            <strong>Warehouse Total Quantity: </strong>
            {warehouse.totalQuantity}
          </span>
          <span className="text-gray-700 text-lg mb-2">
            <strong>Warehouse Total Value: </strong>
            💲{warehouse.totalValue.toFixed(2)}
          </span>
          <p className="text-gray-700 text-lg mb-2">
            <strong>Warehouse ManagedBY: </strong>
            {warehouse.managedBy.map((manager) => (
              <span key={manager._id} className="block">
                {manager.username}
              </span>
            ))}
          </p>
          <div className="mt-6">
            <p className="text-gray-700 text-lg">
              <strong>Warehouse Products: </strong>
              {warehouse.products.map((product) => (
                <div
                  key={product.productId}
                  className="mb-4 border-b pb-4 mt-3"
                >
                  <p className="text-gray-700 text-lg">
                    <strong>Product Name: </strong>
                    {product.name}
                  </p>
                  <p className="text-gray-700 text-lg">
                    <strong>Product Price: </strong>
                    💲{product.price.toFixed(2)}
                  </p>
                  <p className="text-gray-700 text-lg">
                    <strong>Product Quantity: </strong>
                    {product.quantity}
                  </p>
                </div>
              ))}
            </p>
          </div>
        </div>
        <div className="flex space-x-4 justify-items-start items-baseline">
          <Link
            href={`/warehouses/${id}/edit`}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className={`px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors ${
              isDeleting ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting.." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
