import React from "react";
import { InventoryTransaction } from "@/app/types/inventory-transaction";
import Link from "next/link";

interface InventoryTransactionListProp {
  transactions: InventoryTransaction[];
}

//LOGIC TO LIST ALL INVENTORY TRANSACTIONS
const InventoryTransactionList: React.FC<InventoryTransactionListProp> = ({
  transactions,
}) => {
  return (
    <div className="w-full">
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold">
                Type
              </th>
              <th className="py-3 px-4 text-left text-sm font-semibold">
                Products
              </th>
              <th className="py-3 px-4 text-left text-sm font-semibold">
                Total Value
              </th>
              <th className="py-3 px-4 text-left text-sm font-semibold">
                Staff
              </th>
              <th className="py-3 px-4 text-left text-sm font-semibold">
                Date
              </th>
              <th className="py-3 px-4 text-left text-sm font-semibold">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction._id}>
                <td className="py-3 px-4 text-sm">
                  {transaction.transactionType}
                </td>
                <td className="py-3 px-4 text-sm">
                  {transaction.products
                    .map((product) => product.productId.name)
                    .join(", ")}
                </td>
                <td className="py-3 px-4 text-sm">
                  ${transaction.totalValue.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-sm">
                  {transaction.staffId.username}
                </td>
                <td className="py-3 px-4 text-sm">
                  {new Date(transaction.transactionDate).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-sm">
                  <Link
                    href={`/inventory-transactions/${transaction._id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-500">
                  No Transactions results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Shown only on mobile */}
      <div className="sm:hidden space-y-4">
        {transactions.map((transaction) => (
          <div
            key={transaction._id}
            className="bg-white rounded-lg border p-4 space-y-2"
          >
            <div className="flex justify-between items-start">
              <span className="font-semibold text-sm">
                {transaction.transactionType}
              </span>
              <span className="text-sm text-blue-600">
                ${transaction.totalValue.toFixed(2)}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-xs">
                <span className="text-gray-500">Products:</span>
                <span className="ml-2">
                  {transaction.products
                    .map((product) => product.productId.name)
                    .join(", ")}
                </span>
              </div>

              <div className="text-xs">
                <span className="text-gray-500">Staff:</span>
                <span className="ml-2">{transaction.staffId.username}</span>
              </div>

              <div className="text-xs">
                <span className="text-gray-500">Date:</span>
                <span className="ml-2">
                  {new Date(transaction.transactionDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={`/inventory-transactions/${transaction._id}`}
                className="text-blue-600 text-sm hover:underline"
              >
                View Details →
              </Link>
            </div>
          </div>
        ))}

        {transactions.length === 0 && (
          <div className="text-center py-4 text-gray-500 bg-white rounded-lg border">
            No results found
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryTransactionList;
