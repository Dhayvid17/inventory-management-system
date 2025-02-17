import React from "react";
import Link from "next/link";
import { Supplier } from "@/app/types/supplier";

interface SupplierListProps {
  suppliers: Supplier[];
}

//LOGIC TO LIST SUPPLIERS
const SupplierList: React.FC<SupplierListProps> = ({ suppliers }) => (
  <ul className="space-y-4">
    {suppliers.map((supplier) => (
      <li key={supplier._id} className="p-4 border-b border-gray-400">
        <Link
          href={`/suppliers/${supplier._id}`}
          className="text-lg font-medium text-blue-600 hover:text-blue-950"
        >
          {supplier.name}
        </Link>
      </li>
    ))}
    {suppliers.length === 0 && (
      <li className="p-4 text-gray-500 text-center">No results found</li>
    )}
  </ul>
);

export default SupplierList;
