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

//FETCH THE WAREHOUSE DETAILS FROM THE BACKEND SERVER
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

//LOGIC TO DISPLAY EACH WAREHOUSE DETAIL PAGE ON COMPONENT
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

  //LOGIC TO DISPLAY SPINNER WHILE LOADING IS TRUE
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Spinner />
      </div>
    );
  }

  //LOGIC TO DISPLAY NOT-FOUND IF WAREHOUSE DATA RETURN NULL
  if (!warehouse) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex flex-wrap justify-center sm:justify-start gap-4">
              <Link href={`/warehouses/add/product`}>
                <button className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition">
                  Add Product
                </button>
              </Link>
              <Link href={`/warehouses/remove/product`}>
                <button className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition">
                  Remove Product
                </button>
              </Link>
              <Link href={`/warehouses/${id}/inventory`}>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">
                  View Inventory
                </button>
              </Link>
            </div>
            <div className="flex flex-wrap justify-center sm:justify-end gap-4">
              <Link href={`/warehouses/${id}/edit`}>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">
                  Edit
                </button>
              </Link>
              <button
                onClick={handleDelete}
                className={`px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition ${
                  isDeleting ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-4">
                <strong>Warehouse Name: </strong>
                {warehouse.name}{" "}
              </h3>
              <p className="text-gray-700 text-lg mb-2">
                <strong>Type:</strong> {warehouse.type}
              </p>
              <p className="text-gray-700 text-lg mb-2">
                <strong>Location:</strong> {warehouse.location}
              </p>
              <p className="text-gray-700 text-lg mb-2">
                <strong>Capacity:</strong> {warehouse.capacity}
              </p>
              <p className="text-gray-700 text-lg mb-2">
                <strong>Total Quantity:</strong> {warehouse.totalQuantity}
              </p>
              <p className="text-gray-700 text-lg mb-2">
                <strong>Total Value:</strong> 💲
                {warehouse.totalValue.toFixed(2)}
              </p>
              <p className="text-gray-700 text-lg mb-2">
                <strong>Managed By:</strong>
                {warehouse.managedBy.map((manager) => (
                  <span key={manager._id} className="block">
                    {manager.username}
                  </span>
                ))}
              </p>
            </div>
            <div>
              <div className="text-gray-700 text-lg mb-2">
                <strong>Products In Warehouse ({warehouse.name}):</strong>
                {warehouse.products.map((product) => (
                  <div
                    key={product.productId}
                    className="mb-4 p-4 border rounded-md bg-gray-50"
                  >
                    <p className="text-gray-700 text-lg mb-2">
                      <strong>Product Name:</strong> {product.name}
                    </p>
                    <p className="text-gray-700 text-lg mb-2">
                      <strong>Product Price:</strong> 💲
                      {product.price.toFixed(2)}
                    </p>
                    <p className="text-gray-700 text-lg mb-2">
                      <strong>Product Quantity:</strong> {product.quantity}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
