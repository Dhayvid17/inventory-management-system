"use client";

import Spinner from "@/app/components/Spinner";
import { InventoryTransaction } from "@/app/types/inventory-transaction";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import NotFound from "../not-found";

interface InventoryDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

//LOGIC TO GET THE INVENTORY TRANSACTION DETAILS FROM THE BACKEND SERVER
async function getTransactionDetail(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/inventory-transactions/${id}`,
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

//LOGIC TO DISPLAY INVENTORY TRANSACTION DETAILS PAGE
export default function InventoryDetailPage({
  params,
}: InventoryDetailPageProps) {
  const [inventoryTransaction, setInventoryTransaction] =
    useState<InventoryTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  //Unwrap params using React.use()
  const { id } = React.use(params);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const data = await getTransactionDetail(id);
        setInventoryTransaction(data);
      } catch (error) {
        setInventoryTransaction(null);
        console.error("Error fetching transaction:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransaction();
  }, [id]);

  //HANDLE DELETE LOGIC
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      setIsDeleting(true);
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/inventory-transactions/${id}`,
          {
            method: "DELETE",
          }
        );
        alert("Transaction deleted successfully!");
        router.push("/inventory-transactions");
        router.refresh();
      } catch (error) {
        console.error("Error deleting transaction:", error);
        alert("Error deleting transaction");
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
    </div>
  );
}
