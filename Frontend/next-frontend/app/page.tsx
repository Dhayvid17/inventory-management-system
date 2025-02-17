"use client";

import type { Metadata } from "next";
import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "./hooks/useAuthContext";
import Spinner from "./components/Spinner";
import {
  Box,
  Package,
  Warehouse,
  Users,
  Bell,
  ShoppingCart,
  Truck,
  Layout,
  ArrowRightLeft,
  ClipboardList,
  UserCheck,
  PlusSquare,
  MinusSquare,
  History,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

//USE METADATA TO SET THE PAGE TITLE
const metadata: Metadata = {
  title: "Inventory Management System",
  description: "Home Page",
};

//LOGIC FOR INVENTORY HOME COMPONENT
const Home: React.FC = () => {
  const router = useRouter();
  const { state } = useAuthContext();
  const isStaffAdmin =
    state.user?.role === "admin" || state.user?.role === "staff";
  const isAdmin = state.user?.role === "admin";

  useEffect(() => {
    if (state.isLoading) return;

    if (!state.isAuthenticated) {
      router.push("/users/login");
      return;
    }
  }, [state.isLoading, state.isAuthenticated, router, isAdmin, isStaffAdmin]);

  //Menu Items Listed
  const menuItems = {
    primary: [
      {
        title: "Products",
        icon: <Package className="w-8 h-8" />,
        description: "Browse and manage product catalog",
        link: "/products",
        access: "all",
      },
      {
        title: "Order Product(s)",
        icon: <ShoppingCart className="w-8 h-8" />,
        description: "Place new orders for products",
        link: "/orders",
        access: "all",
      },
      {
        title: "Order History",
        icon: <History className="w-8 h-8" />,
        description: "View your order history",
        link: "/orders/user/history",
        access: "all",
      },
      {
        title: "Record Transactions",
        icon: <Box className="w-8 h-8" />,
        description: "Record, track inventory transactions and stock levels",
        link: "/inventory-transactions",
        access: "isStaffAdmin",
      },
    ],
    secondary: [
      {
        title: "Categories",
        icon: <Layout className="w-6 h-6" />,
        link: "/categories",
        access: "isStaffAdmin",
      },
      {
        title: "Warehouses",
        icon: <Warehouse className="w-6 h-6" />,
        link: "/warehouses",
        access: "isStaffAdmin",
      },
      {
        title: "Suppliers",
        icon: <Truck className="w-6 h-6" />,
        link: "/suppliers",
        access: "isStaffAdmin",
      },
      {
        title: "Register Admin/Staff",
        icon: <UserPlus className="w-6 h-6" />,
        link: "users/register",
        access: "isAdmin",
      },
      {
        title: "Staff Management",
        icon: <UserCheck className="w-6 h-6" />,
        link: "/staff-assignments",
        access: "isAdmin",
      },
      {
        title: "User Management",
        icon: <Users className="w-6 h-6" />,
        link: "/users",
        access: "isAdmin",
      },
      {
        title: "Transfer Requests",
        icon: <ArrowRightLeft className="w-6 h-6" />,
        link: "/transfer-request",
        access: "isStaffAdmin",
      },
      {
        title: "Notifications",
        icon: <Bell className="w-6 h-6" />,
        link: "/notifications",
        access: "isStaffAdmin",
      },
      {
        title: "Add to Warehouse",
        icon: <PlusSquare className="w-6 h-6" />,
        link: "/warehouses/add/product",
        access: "isStaffAdmin",
      },
      {
        title: "Remove from Warehouse",
        icon: <MinusSquare className="w-6 h-6" />,
        link: "/warehouses/remove/product",
        access: "isStaffAdmin",
      },
    ],
  };

  //LOGIC TO DISPLAY SPINNER WHEN ISLOADING IS TRUE
  if (state.isLoading) {
    return <Spinner />;
  }

  //LOGIC TO SHOW MENU BASED ON USER ROLE
  const shouldShowMenuItem = (access: string) => {
    if (access === "all") return true;
    if (access === "isStaffAdmin") return isStaffAdmin;
    if (access === "isAdmin") return isAdmin;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Inventory Management System
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Streamline your inventory operations with our comprehensive
            management system. Track products, manage orders, and monitor stock
            levels all in one place. This system helps you efficiently manage
            your inventory, reducing costs and improving customer satisfaction.
          </p>

          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            It also provides a user-friendly interface for staff to manage their
            assignments and track their work. Additionally, it includes a user
            management system for administrators to manage user roles and
            permissions.
          </p>
        </div>

        {/* Primary Features Grid */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Quick Access
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {menuItems.primary
              .filter((item) => shouldShowMenuItem(item.access))
              .map((item) => (
                <Link
                  href={item.link}
                  key={item.title}
                  className="relative group bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="text-blue-600 mb-4">{item.icon}</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </Link>
              ))}
          </div>
        </div>

        {/* Secondary Features */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Additional Features
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {menuItems.secondary
              .filter((item) => shouldShowMenuItem(item.access))
              .map((item) => (
                <Link
                  href={item.link}
                  key={item.title}
                  className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="text-gray-600">{item.icon}</div>
                  <span className="mt-2 text-sm font-medium text-gray-900">
                    {item.title}
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
