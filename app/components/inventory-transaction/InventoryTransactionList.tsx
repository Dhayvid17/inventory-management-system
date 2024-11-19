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
    <div className="overflow-x-auto px-2 sm:px-4">
      <table className="min-w-full bg-white border rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm">
              Type
            </th>
            <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm">
              Products
            </th>
            <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm">
              Total Value
            </th>
            <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm">
              Staff
            </th>
            <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm">
              Date
            </th>
            <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm">
              Details
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction._id} className="border-t">
              <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                {transaction.transactionType}
              </td>
              <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                {transaction.products
                  .map((product) => product.productId.name)
                  .join(", ")}
              </td>
              <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                ${transaction.totalValue.toFixed(2)}
              </td>
              <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                {transaction.staffId.username}
              </td>
              <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                {new Date(transaction.transactionDate).toLocaleDateString()}
              </td>
              <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
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
                No results found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTransactionList;
