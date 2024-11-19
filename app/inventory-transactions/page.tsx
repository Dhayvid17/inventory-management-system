import React, { Suspense } from "react";
import Spinner from "../components/Spinner";
import InventoryTransactionList from "../components/inventory-transaction/InventoryTransactionList";

//LOGIC TO FETCH INVENTORY TRANSACTIONS FROM THE BACKEND SERVER
const fetchInventoryTransactions = async () => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/inventory-transactions`,
    {
      next: {
        revalidate: 0,
      },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch inventory transactions");
  const data = await res.json();
  return data;
};

//LOGIC TO DISPLAY THE INVENTORY TRANSACTION PAGE
const inventoryTransactionPage: React.FC = async () => {
  const transactions = await fetchInventoryTransactions();
  return (
    <div className="container">
      <h1 className="text-2xl font-bold m-4">Inventory Transactions</h1>
      <Suspense fallback={<Spinner />}>
        <InventoryTransactionList transactions={transactions} />
      </Suspense>
    </div>
  );
};

export default inventoryTransactionPage;
