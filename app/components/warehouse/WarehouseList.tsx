import React from "react";
import Link from "next/link";
import { Warehouse } from "@/app/types/warehouse";

interface WarehouseListProps {
  warehouses: Warehouse[];
}

//LOGIC TO LIST WAREHOUSES
const WarehouseList: React.FC<WarehouseListProps> = ({ warehouses }) => (
  <ul className="space-y-4">
    {warehouses.map((warehouse) => (
      <li key={warehouse._id} className="p-4 border-b border-gray-400">
        <Link
          href={`/warehouses/${warehouse._id}`}
          className="text-lg font-medium text-blue-600 hover:text-blue-950"
        >
          {warehouse.name}
        </Link>
      </li>
    ))}
    {warehouses.length === 0 && (
      <li className="p-4 text-gray-500 text-center">No results found</li>
    )}
  </ul>
);

export default WarehouseList;
