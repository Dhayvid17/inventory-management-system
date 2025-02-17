import React from "react";
import { TransferRequest } from "@/app/types/transfer-request";
import Link from "next/link";

interface TransferRequestListProps {
  transferRequests: TransferRequest[];
}
const TransferRequestList: React.FC<TransferRequestListProps> = ({
  transferRequests,
}) => {
  return (
    <div>
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <h2 className="text-lg font-medium">From Warehouse</h2>
          {transferRequests.map((transfer) => (
            <div
              key={transfer._id}
              className="border rounded-lg shadow-md p-4 bg-white"
            >
              <h2 className="text-xl font-semibold">
                {transfer.fromWarehouseId.name} ➡ {transfer.toWarehouseId.name}
              </h2>
              <p className="text-sm text-gray-500">
                Transfer Type: {transfer.transferType}
              </p>
              <p className="text-sm text-gray-500">Status: {transfer.status}</p>
              <p className="text-sm text-gray-500">
                Total Quantity: {transfer.totalQuantity}
              </p>
              <p className="text-sm text-gray-500">
                Total Price: ${transfer.totalPrice.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">
                Request Date:{" "}
                {new Date(transfer.requestDate).toLocaleDateString()}
              </p>
              <Link
                href={`/transfer-request/${transfer._id}`}
                className="text-lg font-medium text-blue-600 hover:text-blue-950"
              >
                View Details
              </Link>
            </div>
          ))}
          {transferRequests.length === 0 && (
            <li className="p-4 text-gray-500 text-center">No results found</li>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferRequestList;
