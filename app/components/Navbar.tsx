"use client";

import Link from "next/link";
import React from "react";
import LogoutButton from "../hooks/useLogout";
import { useAuthContext } from "../hooks/useAuthContext";
import { useRouter } from "next/navigation";
import Spinner from "./Spinner";

//LOGIC FOR NAV-BAR
const Navbar: React.FC = () => {
  const { state, dispatch } = useAuthContext();
  const router = useRouter();

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("token");
    router.push("/login"); // Redirect to login
  };

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
          <li>
            <Link href="/orders" className="text-white hover:text-gray-300">
              Order
            </Link>
          </li>
          <div>
            {state.isLoading ? (
              <span>Loading...</span>
            ) : state.isAuthenticated ? (
              <>
                <span className="mr-4">Welcome, {state.user?.username}</span>
                <button onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push("/users/login")}
                  className="mr-4"
                >
                  Login
                </button>
                <button onClick={() => router.push("/users/register")}>
                  Register
                </button>
              </>
            )}
          </div>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
