import Link from "next/link";
import React from "react";

//LOGIC FOR NAV-BAR
const Navbar: React.FC = () => {
  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-semibold">
          Inventory System
        </Link>
        <ul className="flex space-x-6">
          <li>
            <Link href="/categories" className="hover:text-blue-200">
              Categories
            </Link>
          </li>
          <li>
            <Link href="/warehouses" className="hover:text-blue-200">
              Warehouses
            </Link>
          </li>
          <li>
            <Link href="/suppliers" className="hover:text-blue-200">
              Suppliers
            </Link>
          </li>
          <li>
            <Link href="/products" className="hover:text-blue-200">
              Products
            </Link>
          </li>
          <li>
            <Link href="/staff-assignments" className="hover:text-blue-200">
              Staff Assignments
            </Link>
          </li>
          <li>
            <Link
              href="/orders/history"
              className="text-white hover:text-gray-300"
            >
              Order History
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
