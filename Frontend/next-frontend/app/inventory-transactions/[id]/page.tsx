"use client";

import Spinner from "@/app/components/Spinner";
import { InventoryTransaction } from "@/app/types/inventory-transaction";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import NotFound from "../not-found";
import { useAuthContext } from "@/app/hooks/useAuthContext";

interface InventoryDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

//LOGIC TO GET THE INVENTORY TRANSACTION DETAILS FROM THE BACKEND SERVER
async function getTransactionDetail(id: string, token: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/inventory-transactions/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: {
        revalidate: 60,
      },
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch inventory: ${res.statusText}`);
  }
  const data = await res.json();
  return data;
}

//LOGIC TO DISPLAY INVENTORY TRANSACTION DETAILS PAGE
export default function InventoryDetailPage({
  params,
}: InventoryDetailPageProps) {
  const [inventoryTransaction, setInventoryTransaction] =
    useState<InventoryTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { state } = useAuthContext();
  const router = useRouter();

  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";
  const isAdmin = state.user?.role === "admin";

  //Unwrap params using React.use()
  const { id } = React.use(params);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!state.isAuthenticated) {
        router.push("/users/login"); //Redirect to login if not authenticated
        return;
      }
      try {
        const data = await getTransactionDetail(id, state.token || "");
        setInventoryTransaction(data);
      } catch (error: any) {
        setInventoryTransaction(null);
        setError(error.message);
        console.error("Error fetching transaction:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransaction();
  }, [id, state.isAuthenticated, state.token, router]);

  //HANDLE DELETE LOGIC
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      setIsDeleting(true);
      if (!isAdmin) {
        setError("You are not authorized to delete this transaction");
        return;
      }
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/inventory-transactions/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${state.token}`,
            },
          }
        );
        alert("Transaction deleted successfully!");
        router.push("/inventory-transactions");
        router.refresh();
      } catch (error: any) {
        console.error("Error deleting transaction:", error);
        alert(`Error deleting transaction: ${error.message}`);
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

  //DISPLAY ERROR MESSAGE
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md mx-auto"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg
              className="fill-current h-6 w-6 text-red-500"
              role="button"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <title>Close</title>
              <path d="M14.348 5.652a1 1 0 00-1.414 0L10 8.586 7.066 5.652a1 1 0 10-1.414 1.414L8.586 10l-2.934 2.934a1 1 0 101.414 1.414L10 11.414l2.934 2.934a1 1 0 001.414-1.414L11.414 10l2.934-2.934a1 1 0 000-1.414z" />
            </svg>
          </span>
        </div>
      </div>
    );
  }

  //LOGIC TO DISPLAY NOT-FOUND IF TRANSACTION DATA RETURN NULL
  if (!inventoryTransaction) {
    return <NotFound />;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white shadow-md rounded">
      <h1 className="text-2xl font-bold mb-4">Transaction Details</h1>
      <div className="space-y-2">
        <p>
          <strong>Transaction ID:</strong> {inventoryTransaction._id}
        </p>
        <p>
          <strong>Date:</strong>{" "}
          {new Date(inventoryTransaction.transactionDate).toLocaleString()}
        </p>
        <p>
          <strong>Type:</strong> {inventoryTransaction.transactionType}
        </p>
        <p>
          <strong>Products:</strong>{" "}
          {inventoryTransaction.products
            .map(
              (product) =>
                `${product.productId.name} (Quantity: ${product.quantity})`
            )
            .join(", ")}
        </p>
        <p>
          <strong>Total Value:</strong> $
          {inventoryTransaction.totalValue.toFixed(2)}
        </p>
        <p>
          <strong>Staff:</strong> {inventoryTransaction.staffId.username}
        </p>
        {inventoryTransaction.fromWarehouseId && (
          <p>
            <strong>From Warehouse:</strong>{" "}
            {inventoryTransaction.fromWarehouseId.name}
          </p>
        )}
        {inventoryTransaction.toWarehouseId && (
          <p>
            <strong>To Warehouse:</strong>{" "}
            {inventoryTransaction.toWarehouseId.name}
          </p>
        )}
        {inventoryTransaction.warehouseId && (
          <p>
            <strong>Warehouse:</strong> {inventoryTransaction.warehouseId.name}
          </p>
        )}
        {inventoryTransaction.supplierId && (
          <p>
            <strong>Supplier:</strong> {inventoryTransaction.supplierId.name}
          </p>
        )}
        {inventoryTransaction.customerId && (
          <p>
            <strong>Customer:</strong>{" "}
            {inventoryTransaction.customerId.username}
          </p>
        )}
        {inventoryTransaction.note && (
          <p>
            <strong>Note:</strong> {inventoryTransaction.note}
          </p>
        )}
        {inventoryTransaction.interWarehouseTransferStatus && (
          <p>
            <strong>Inter-Warehouse Transfer Status:</strong>{" "}
            {inventoryTransaction.interWarehouseTransferStatus}
          </p>
        )}
      </div>
      {isStaffAdmin && (
        <div className="flex space-x-4 justify-items-start items-baseline mt-4">
          <Link
            href={`/inventory-transactions/${id}/edit`}
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
      )}
    </div>
  );
}
